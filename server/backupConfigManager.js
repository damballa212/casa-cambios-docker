
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'backup-config.json');

// Ensure config file exists
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify([], null, 2));
}

export const backupConfigManager = {
  getAll: async () => {
    try {
      if (!fs.existsSync(CONFIG_FILE)) return [];
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading backup config:', error);
      return [];
    }
  },

  getById: async (id) => {
    const configs = await backupConfigManager.getAll();
    return configs.find(c => c.id === Number(id));
  },

  create: async (config) => {
    const configs = await backupConfigManager.getAll();
    const newConfig = {
      ...config,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    configs.push(newConfig);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2));
    return newConfig;
  },

  update: async (id, updates) => {
    const configs = await backupConfigManager.getAll();
    const index = configs.findIndex(c => c.id === Number(id));
    if (index === -1) throw new Error('Configuration not found');

    const updatedConfig = {
      ...configs[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    configs[index] = updatedConfig;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2));
    return updatedConfig;
  },

  delete: async (id) => {
    const configs = await backupConfigManager.getAll();
    const filtered = configs.filter(c => c.id !== Number(id));
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(filtered, null, 2));
    return true;
  }
};
