// Simple in-memory cache mock for development
// In production, this should be replaced with actual Redis client

class RedisMock {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    this.checkExpiry(key);
    return this.cache.get(key) || null;
  }

  async set(key, value) {
    this.cache.set(key, value);
    return 'OK';
  }

  async setex(key, seconds, value) {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        count++;
      }
      this.ttls.delete(key);
    }
    return count;
  }

  async keys(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async incrby(key, amount) {
    const current = parseInt(this.cache.get(key) || '0');
    const newValue = current + amount;
    this.cache.set(key, newValue.toString());
    return newValue;
  }

  async exists(key) {
    this.checkExpiry(key);
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    if (this.cache.has(key)) {
      this.ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    if (!this.cache.has(key)) {
      return -2;
    }
    const expiry = this.ttls.get(key);
    if (!expiry) {
      return -1;
    }
    const remaining = Math.floor((expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async mget(...keys) {
    return keys.map(key => this.cache.get(key) || null);
  }

  pipeline() {
    return {
      commands: [],
      set(key, value) {
        this.commands.push({ type: 'set', key, value });
        return this;
      },
      setex(key, seconds, value) {
        this.commands.push({ type: 'setex', key, seconds, value });
        return this;
      },
      del(key) {
        this.commands.push({ type: 'del', key });
        return this;
      },
      async exec() {
        const results = [];
        for (const cmd of this.commands) {
          if (cmd.type === 'set') {
            await this.redis.set(cmd.key, cmd.value);
            results.push([null, 'OK']);
          } else if (cmd.type === 'setex') {
            await this.redis.setex(cmd.key, cmd.seconds, cmd.value);
            results.push([null, 'OK']);
          } else if (cmd.type === 'del') {
            const result = await this.redis.del(cmd.key);
            results.push([null, result]);
          }
        }
        this.commands = [];
        return results;
      },
      redis: this
    };
  }

  async publish(channel, message) {
    // Mock publish - in production this would use actual Redis pub/sub
    console.log(`[Redis Mock] Published to ${channel}:`, message);
    return 1;
  }

  checkExpiry(key) {
    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.ttls.delete(key);
    }
  }
}

module.exports = new RedisMock();
