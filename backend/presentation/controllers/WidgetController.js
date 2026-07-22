const { pool } = require('../../config/db');

class WidgetController {
  async getWidgetsMap(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing' });
    }

    try {
      const queryText = 'SELECT widgets_map FROM user_widgets WHERE user_id = $1';
      const result = await pool.query(queryText, [String(userId)]);
      
      if (result.rows.length > 0) {
        return res.status(200).json({ success: true, widgetsMap: result.rows[0].widgets_map });
      } else {
        return res.status(200).json({ success: true, widgetsMap: null });
      }
    } catch (err) {
      console.error('Failed to retrieve widgets map:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async saveWidgetsMap(req, res) {
    const userId = req.user?.userId;
    const { widgetsMap } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing' });
    }
    if (!widgetsMap) {
      return res.status(400).json({ error: 'Widgets map is required' });
    }

    try {
      const queryText = `
        INSERT INTO user_widgets (user_id, widgets_map, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET 
          widgets_map = EXCLUDED.widgets_map,
          updated_at = CURRENT_TIMESTAMP
      `;
      await pool.query(queryText, [String(userId), JSON.stringify(widgetsMap)]);
      return res.status(200).json({ success: true, message: 'Widgets map saved successfully' });
    } catch (err) {
      console.error('Failed to save widgets map:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new WidgetController();
