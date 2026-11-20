import ApiConfiguration from '../models/ApiConfiguration.js';
import { encrypt, decrypt, maskApiKey } from '../services/cryptoService.js';
import { testGeminiConnection } from '../services/geminiService.js';
import { testImageProviderConnection } from '../services/imageService.js';
import { testCloudinaryConnection } from '../services/cloudinaryService.js';

export async function getApiConfigurations(req, res, next) {
  try {
    const configs = await ApiConfiguration.find({ userId: req.userId }).sort({ providerType: 1 });

    // Map through configs and mask secrets so plain text is NEVER returned to browser
    const safeConfigs = configs.map((c) => {
      let maskedKey = '';
      let maskedSecret = '';

      if (c.encryptedApiKey) {
        try {
          const rawKey = decrypt(c.encryptedApiKey);
          maskedKey = maskApiKey(rawKey);
        } catch {
          maskedKey = '••••••••';
        }
      }

      if (c.encryptedApiSecret) {
        try {
          const rawSecret = decrypt(c.encryptedApiSecret);
          maskedSecret = maskApiKey(rawSecret);
        } catch {
          maskedSecret = '••••••••';
        }
      }

      return {
        _id: c._id,
        providerType: c.providerType,
        providerName: c.providerName,
        endpoint: c.endpoint,
        model: c.model,
        dimensions: c.dimensions,
        maskedApiKey: maskedKey,
        maskedApiSecret: maskedSecret,
        hasApiKey: Boolean(c.encryptedApiKey),
        hasApiSecret: Boolean(c.encryptedApiSecret),
        isEnabled: c.isEnabled,
        isDefault: c.isDefault,
        testStatus: c.testStatus,
        lastTestedAt: c.lastTestedAt,
        lastErrorMessage: c.lastErrorMessage,
        updatedAt: c.updatedAt,
      };
    });

    res.json({
      success: true,
      configurations: safeConfigs,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveApiConfiguration(req, res, next) {
  try {
    const {
      id,
      providerType,
      providerName,
      endpoint,
      model,
      dimensions,
      apiKey,
      apiSecret,
      isEnabled = true,
      isDefault = false,
    } = req.body;

    if (!providerType || !providerName) {
      return res.status(400).json({
        success: false,
        message: 'Provider type and provider name are required',
      });
    }

    let config;
    if (id) {
      config = await ApiConfiguration.findOne({ _id: id, userId: req.userId });
      if (!config) return res.status(404).json({ success: false, message: 'Configuration not found' });
    } else {
      config = await ApiConfiguration.findOne({
        userId: req.userId,
        providerType,
        providerName,
      });

      if (!config) {
        config = new ApiConfiguration({
          userId: req.userId,
          providerType,
          providerName,
        });
      }
    }

    if (endpoint !== undefined) config.endpoint = endpoint.trim();
    if (model !== undefined) config.model = model.trim();
    if (dimensions !== undefined) config.dimensions = dimensions.trim();
    if (isEnabled !== undefined) config.isEnabled = Boolean(isEnabled);

    // If new API key provided, encrypt and store safely
    if (apiKey && apiKey.trim() && !apiKey.includes('••••')) {
      config.encryptedApiKey = encrypt(apiKey.trim());
      config.testStatus = 'untested';
    }

    // If new API secret provided (e.g. Cloudinary)
    if (apiSecret && apiSecret.trim() && !apiSecret.includes('••••')) {
      config.encryptedApiSecret = encrypt(apiSecret.trim());
      config.testStatus = 'untested';
    }

    if (isDefault) {
      await ApiConfiguration.updateMany(
        { userId: req.userId, providerType },
        { isDefault: false }
      );
      config.isDefault = true;
    }

    await config.save();

    res.json({
      success: true,
      message: `${providerName} configuration saved securely.`,
      configId: config._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function testConnection(req, res, next) {
  try {
    const { id, providerType, providerName, apiKey, apiSecret, endpoint, model } = req.body;

    let targetKey = apiKey;
    let targetSecret = apiSecret;
    let targetEndpoint = endpoint;
    let targetModel = model;

    let config = null;
    if (id) {
      config = await ApiConfiguration.findOne({ _id: id, userId: req.userId });
      if (config) {
        if (!targetKey && config.encryptedApiKey) {
          targetKey = decrypt(config.encryptedApiKey);
        }
        if (!targetSecret && config.encryptedApiSecret) {
          targetSecret = decrypt(config.encryptedApiSecret);
        }
        targetEndpoint = targetEndpoint || config.endpoint;
        targetModel = targetModel || config.model;
      }
    }

    let testResult;

    if (providerType === 'text_ai') {
      testResult = await testGeminiConnection(targetKey, targetModel || 'gemini-1.5-flash', targetEndpoint);
    } else if (providerType === 'image_generation') {
      // If testing Gemini Imagen and no dedicated key provided, inherit from Text AI or env
      if ((providerName === 'gemini_imagen' || providerName === 'gemini') && !targetKey) {
        const textAiConfig = await ApiConfiguration.findOne({ userId: req.userId, providerType: 'text_ai' });
        if (textAiConfig?.encryptedApiKey) {
          try {
            targetKey = decrypt(textAiConfig.encryptedApiKey);
          } catch {}
        }
        if (!targetKey && process.env.GEMINI_API_KEY) {
          targetKey = process.env.GEMINI_API_KEY;
        }
      } else if ((providerName === 'openai' || providerName === 'dalle') && !targetKey) {
        if (process.env.OPENAI_API_KEY) {
          targetKey = process.env.OPENAI_API_KEY;
        }
      }

      testResult = await testImageProviderConnection({
        providerName,
        apiKey: targetKey,
        endpoint: targetEndpoint,
        model: targetModel,
      });
    } else if (providerType === 'storage') {
      testResult = await testCloudinaryConnection(targetEndpoint, targetKey, targetSecret);
    } else {
      throw new Error('Unsupported provider type for automated test');
    }

    if (config) {
      config.testStatus = 'connected';
      config.lastTestedAt = new Date();
      config.lastErrorMessage = null;
      await config.save();
    }

    res.json({
      success: true,
      message: testResult.message,
    });
  } catch (err) {
    if (req.body.id) {
      await ApiConfiguration.updateOne(
        { _id: req.body.id, userId: req.userId },
        { testStatus: 'failed', lastTestedAt: new Date(), lastErrorMessage: err.message }
      );
    }
    res.status(400).json({
      success: false,
      message: err.message || 'Connection test failed',
    });
  }
}

export async function deleteApiConfiguration(req, res, next) {
  try {
    const config = await ApiConfiguration.findOne({ _id: req.params.id, userId: req.userId });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    await config.deleteOne();

    res.json({
      success: true,
      message: 'API configuration deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
