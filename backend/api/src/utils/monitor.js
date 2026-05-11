// Monitoramento básico
export function simpleMonitor() {
  const monitor = {
    checkDatabase: async () => {
      try {
        await pool.execute('SELECT 1');
        return { status: 'healthy' };
      } catch (error) {
        return { status: 'unhealthy', error: error.message };
      }
    },
    
    checkApis: async () => {
      const apis = [
        { name: 'Vatican News', url: 'https://www.vaticannews.va/pt.rss.xml' },
        { name: 'YouTube', url: 'https://youtube.com' },
        { name: 'Instagram', url: 'https://instagram.com' }
      ];
      
      const results = [];
      for (const api of apis) {
        try {
          const start = Date.now();
          await axios.head(api.url, { timeout: 5000 });
          const latency = Date.now() - start;
          results.push({ ...api, status: 'up', latency });
        } catch (error) {
          results.push({ ...api, status: 'down', error: error.message });
        }
      }
      
      return results;
    },
    
    getSystemInfo: () => {
      return {
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        env: process.env.NODE_ENV
      };
    }
  };
  
  return monitor;
}

// Usar no server.js
app.get('/api/admin/monitor', authenticateToken, async (req, res) => {
  const monitor = simpleMonitor();
  const [db, apis, system] = await Promise.all([
    monitor.checkDatabase(),
    monitor.checkApis(),
    monitor.getSystemInfo()
  ]);
  
  res.json({ database: db, apis, system });
});