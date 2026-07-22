const { userPool, iotPool } = require('../../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AdminController {
  // Log helper for security auditing
  async logAdminAction(adminId, action, ipAddress, metadata = {}) {
    try {
      const queryText = `
        INSERT INTO user_audit_logs (user_id, action, ip_address, metadata)
        VALUES ($1, $2, $3, $4)
      `;
      await userPool.query(queryText, [adminId, action, ipAddress, JSON.stringify(metadata)]);
    } catch (err) {
      console.error('Failed to log admin action audit:', err.message);
    }
  }

  // 1. Get stats overview across dual databases
  async getStats(req, res) {
    try {
      // User DB counts
      const userCountRes = await userPool.query('SELECT COUNT(*) FROM users');
      const auditCountRes = await userPool.query('SELECT COUNT(*) FROM user_audit_logs');
      const orgCountRes = await userPool.query('SELECT COUNT(*) FROM organizations');

      // IoT DB counts
      const deviceCountRes = await iotPool.query('SELECT COUNT(*) FROM iot_devices');
      const telemetryCountRes = await iotPool.query('SELECT COUNT(*) FROM iot_telemetry');
      const logCountRes = await iotPool.query('SELECT COUNT(*) FROM iot_logs');
      const alertHistoryCountRes = await iotPool.query('SELECT COUNT(*) FROM iot_alerts_history');

      // Active Connection Diagnostics
      let activeConnectionsUser = 0;
      let activeConnectionsIot = 0;

      try {
        const actUser = await userPool.query("SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()");
        activeConnectionsUser = parseInt(actUser.rows[0].count, 10);
      } catch (e) {
        activeConnectionsUser = 1; // Fallback
      }

      try {
        const actIot = await iotPool.query("SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()");
        activeConnectionsIot = parseInt(actIot.rows[0].count, 10);
      } catch (e) {
        activeConnectionsIot = 1; // Fallback
      }

      res.status(200).json({
        usersCount: parseInt(userCountRes.rows[0].count, 10),
        organizationsCount: parseInt(orgCountRes.rows[0].count, 10),
        auditLogsCount: parseInt(auditCountRes.rows[0].count, 10),
        devicesCount: parseInt(deviceCountRes.rows[0].count, 10),
        telemetryCount: parseInt(telemetryCountRes.rows[0].count, 10),
        iotLogsCount: parseInt(logCountRes.rows[0].count, 10),
        alertsCount: parseInt(alertHistoryCountRes.rows[0].count, 10),
        dbConnections: {
          userDb: activeConnectionsUser,
          iotDb: activeConnectionsIot
        }
      });
    } catch (err) {
      console.error('getStats admin error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 2. Dual Database Table Diagnostics & Size check
  async getDbDiagnostics(req, res) {
    try {
      const userTables = ['users', 'user_audit_logs', 'organizations', 'organization_members'];
      const iotTables = ['iot_devices', 'iot_telemetry', 'iot_logs', 'iot_alert_rules', 'iot_alerts_history', 'user_ai_settings', 'user_widgets', 'chat_messages'];

      const userDiagnostics = [];
      const iotDiagnostics = [];

      // Fetch User DB table metrics
      for (const table of userTables) {
        try {
          const rowCountRes = await userPool.query(`SELECT COUNT(*) FROM ${table}`);
          const sizeRes = await userPool.query(`SELECT pg_size_pretty(pg_total_relation_size($1::text)) as size, pg_total_relation_size($1::text) as size_bytes`, [table]);
          userDiagnostics.push({
            tableName: table,
            rows: parseInt(rowCountRes.rows[0].count, 10),
            size: sizeRes.rows[0].size,
            sizeBytes: parseInt(sizeRes.rows[0].size_bytes, 10)
          });
        } catch (err) {
          userDiagnostics.push({ tableName: table, error: err.message });
        }
      }

      // Fetch IoT DB table metrics
      for (const table of iotTables) {
        try {
          const rowCountRes = await iotPool.query(`SELECT COUNT(*) FROM ${table}`);
          const sizeRes = await iotPool.query(`SELECT pg_size_pretty(pg_total_relation_size($1::text)) as size, pg_total_relation_size($1::text) as size_bytes`, [table]);
          iotDiagnostics.push({
            tableName: table,
            rows: parseInt(rowCountRes.rows[0].count, 10),
            size: sizeRes.rows[0].size,
            sizeBytes: parseInt(sizeRes.rows[0].size_bytes, 10)
          });
        } catch (err) {
          iotDiagnostics.push({ tableName: table, error: err.message });
        }
      }

      // Fetch Postgres Server Versions and Databases Sizes
      let userDbVersion = 'Unknown';
      let userDbSize = 'Unknown';
      try {
        const ver = await userPool.query('SELECT version()');
        userDbVersion = ver.rows[0].version.split(' on ')[0];
        const dbSz = await userPool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
        userDbSize = dbSz.rows[0].size;
      } catch (e) {}

      let iotDbVersion = 'Unknown';
      let iotDbSize = 'Unknown';
      try {
        const ver = await iotPool.query('SELECT version()');
        iotDbVersion = ver.rows[0].version.split(' on ')[0];
        const dbSz = await iotPool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
        iotDbSize = dbSz.rows[0].size;
      } catch (e) {}

      res.status(200).json({
        userDb: {
          version: userDbVersion,
          totalSize: userDbSize,
          tables: userDiagnostics
        },
        iotDb: {
          version: iotDbVersion,
          totalSize: iotDbSize,
          tables: iotDiagnostics
        }
      });
    } catch (err) {
      console.error('getDbDiagnostics admin error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 3. User Management - List Users
  async getUsers(req, res) {
    try {
      const queryText = `
        SELECT id, name, email, role, profile_pic, created_at,
               (SELECT COUNT(*) FROM user_audit_logs WHERE user_id = users.id) AS audit_count
        FROM users 
        ORDER BY id ASC
      `;
      const result = await userPool.query(queryText);
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 4. User Management - Create User
  async createUser(req, res) {
    const { name, email, password, role } = req.body;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, role) are required.' });
    }

    try {
      const existingUser = await userPool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const insertText = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
      `;
      const result = await userPool.query(insertText, [name.trim(), email.toLowerCase().trim(), hashedPassword, role]);
      
      const newUser = result.rows[0];
      await this.logAdminAction(adminId, 'CREATE_USER', ipAddress, { targetUserId: newUser.id, targetEmail: newUser.email, role: newUser.role });

      res.status(201).json({ success: true, user: newUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 5. User Management - Update User Role
  async updateUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!role) {
      return res.status(400).json({ error: 'Role field is required.' });
    }

    // Prevent demoting oneself
    if (String(id) === String(adminId)) {
      return res.status(400).json({ error: 'Security constraint: You cannot promote or demote your own user account role.' });
    }

    try {
      const updateText = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role';
      const result = await userPool.query(updateText, [role, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = result.rows[0];
      await this.logAdminAction(adminId, 'UPDATE_USER_ROLE', ipAddress, { targetUserId: id, newRole: role });

      res.status(200).json({ success: true, user: updatedUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 12. User Management - Update User Details
  async updateUserDetails(req, res) {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      const userRes = await userPool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const existingUser = userRes.rows[0];

      if (email && email.toLowerCase().trim() !== existingUser.email) {
        const checkEmail = await userPool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (checkEmail.rows.length > 0) {
          return res.status(400).json({ error: 'Email address is already in use by another user.' });
        }
      }

      const updatedName = name ? name.trim() : existingUser.name;
      const updatedEmail = email ? email.toLowerCase().trim() : existingUser.email;
      let updatedRole = role || existingUser.role;

      if (String(id) === String(adminId) && role && role !== 'ADMIN') {
        return res.status(400).json({ error: 'Security constraint: You cannot demote your own administrator role.' });
      }

      let queryText = 'UPDATE users SET name = $1, email = $2, role = $3';
      const queryParams = [updatedName, updatedEmail, updatedRole];

      if (password && password.trim().length >= 6) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        queryText += ', password_hash = $4 WHERE id = $5 RETURNING id, name, email, role';
        queryParams.push(hashedPassword, id);
      } else {
        queryText += ' WHERE id = $4 RETURNING id, name, email, role';
        queryParams.push(id);
      }

      const result = await userPool.query(queryText, queryParams);
      const updatedUser = result.rows[0];

      await this.logAdminAction(adminId, 'UPDATE_USER_DETAILS', ipAddress, { targetUserId: id, email: updatedEmail });

      res.status(200).json({ success: true, user: updatedUser });
    } catch (err) {
      console.error('updateUserDetails error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 6. User Management - Delete User
  async deleteUser(req, res) {
    const { id } = req.params;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (String(id) === String(adminId)) {
      return res.status(400).json({ error: 'Security constraint: You cannot delete your own admin account.' });
    }

    try {
      const userRes = await userPool.query('SELECT name, email FROM users WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userToDelete = userRes.rows[0];

      // Delete user
      await userPool.query('DELETE FROM users WHERE id = $1', [id]);
      await this.logAdminAction(adminId, 'DELETE_USER', ipAddress, { targetUserId: id, targetEmail: userToDelete.email });

      res.status(200).json({ success: true, message: 'User account deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 7. Device Directory - Fetch All Devices (Cross-Database Join Emulation)
  async getDevices(req, res) {
    try {
      // 1. Fetch devices from IoT DB
      const deviceRes = await iotPool.query('SELECT * FROM iot_devices ORDER BY created_at DESC');
      // 2. Fetch users from User DB
      const userRes = await userPool.query('SELECT id, name, email FROM users');

      const userMap = {};
      userRes.rows.forEach(u => {
        userMap[String(u.id)] = u;
      });

      // 3. Emulate JOIN
      const mappedDevices = deviceRes.rows.map(device => {
        const ownerId = device.user_id;
        const owner = ownerId && userMap[String(ownerId)] ? userMap[String(ownerId)] : null;
        return {
          id: device.id,
          name: device.name,
          secretKey: device.secret_key,
          status: device.status,
          lastHeartbeat: device.last_heartbeat,
          userId: ownerId,
          orgId: device.org_id,
          createdAt: device.created_at,
          ownerName: owner ? owner.name : 'System Gateway',
          ownerEmail: owner ? owner.email : 'system@nexus.io'
        };
      });

      res.status(200).json(mappedDevices);
    } catch (err) {
      console.error('getDevices admin error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 8. Device Directory - Delete/De-register Device
  async deleteDevice(req, res) {
    const { id } = req.params;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      const checkDevice = await iotPool.query('SELECT name, user_id FROM iot_devices WHERE id = $1', [id]);
      if (checkDevice.rows.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      await iotPool.query('DELETE FROM iot_devices WHERE id = $1', [id]);
      await this.logAdminAction(adminId, 'DELETE_DEVICE', ipAddress, { deviceId: id, deviceName: checkDevice.rows[0].name });

      res.status(200).json({ success: true, message: `Device ${id} deleted successfully.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 9. Device Directory - Regenerate Device Secret Key
  async regenerateDeviceToken(req, res) {
    const { id } = req.params;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      const checkDevice = await iotPool.query('SELECT name FROM iot_devices WHERE id = $1', [id]);
      if (checkDevice.rows.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const newSecret = crypto.randomBytes(24).toString('hex');
      await iotPool.query('UPDATE iot_devices SET secret_key = $1 WHERE id = $2', [newSecret, id]);
      await this.logAdminAction(adminId, 'REGENERATE_DEVICE_TOKEN', ipAddress, { deviceId: id, deviceName: checkDevice.rows[0].name });

      res.status(200).json({ success: true, secretKey: newSecret });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 10. Audit Ledger - Fetch Audit logs
  async getAuditLogs(req, res) {
    try {
      const queryText = `
        SELECT l.*, u.name as user_name, u.email as user_email
        FROM user_audit_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.timestamp DESC
        LIMIT 250
      `;
      const result = await userPool.query(queryText);
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 11. Maintenance - Clear Transient Device debug logs
  async clearDeviceLogs(req, res) {
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      const result = await iotPool.query('DELETE FROM iot_logs');
      await this.logAdminAction(adminId, 'CLEAR_DEVICE_LOGS', ipAddress, { clearedCount: result.rowCount });
      res.status(200).json({ success: true, message: `All transient device debug logs purged. Cleared ${result.rowCount} log lines.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AdminController();
