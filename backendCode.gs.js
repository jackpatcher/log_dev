// code.gs - Google Apps Script for Dev Log Portfolio
// ตั้งค่า: ให้ SHEET_ID และ MASTER_PASSWORD ด้านล่าง

const SHEET_ID = 'your-sheet-id-here'; // ใส่ ID ของ Google Sheet
const MASTER_PASSWORD = 'your-password-here'; // ใส่รหัสผ่านที่ต้องการ

function doGet(e) {
  const action = e.parameter.action || '';
  const callback = e.parameter.callback || 'callback';

  try {
    let response = {};

    if (action === 'getLogs') {
      response = handleGetLogs();
    } else if (action === 'createLog') {
      response = handleCreateLog(e.parameter);
    } else if (action === 'updateLog') {
      response = handleUpdateLog(e.parameter);
    } else if (action === 'deleteLog') {
      response = handleDeleteLog(e.parameter);
    } else if (action === 'getProjects') {
      response = handleGetProjects();
    } else if (action === 'createProject') {
      response = handleCreateProject(e.parameter);
    } else if (action === 'updateProject') {
      response = handleUpdateProject(e.parameter);
    } else if (action === 'deleteProject') {
      response = handleDeleteProject(e.parameter);
    } else {
      response = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(
      callback + '(' + JSON.stringify(response) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);

  } catch (error) {
    return ContentService.createTextOutput(
      callback + '(' + JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

// ===== LOGS HANDLERS =====

function handleGetLogs() {
  try {
    const sheet = getLogsSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = values[0];
    const logs = values.slice(1).map((row, index) => {
      const log = {};
      headers.forEach((header, i) => {
        log[header] = row[i] || '';
      });
      log.id = index + 1; // Simple ID based on row
      return log;
    });

    return { success: true, data: logs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleCreateLog(params) {
  if (!verifyPassword(params.password)) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    const sheet = getLogsSheet();
    const newRow = [
      params.app_name || '',
      params.version || '',
      params.summary || '',
      params.tags || '',
      params.status || 'in_progress',
      params.info || '{}',
      new Date().toISOString(),
      params.password ? '****' : '' // Don't store actual password
    ];

    sheet.appendRow(newRow);

    return { success: true, message: 'Log created successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleUpdateLog(params) {
  if (!verifyPassword(params.password)) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    const sheet = getLogsSheet();
    const logId = parseInt(params.id);
    const rowIndex = logId + 1; // +1 for header row

    const range = sheet.getRange(rowIndex, 1, 1, 8);
    range.setValues([[
      params.app_name || '',
      params.version || '',
      params.summary || '',
      params.tags || '',
      params.status || 'in_progress',
      params.info || '{}',
      new Date().toISOString(),
      '****'
    ]]);

    return { success: true, message: 'Log updated successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeleteLog(params) {
  if (!verifyPassword(params.password)) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    const sheet = getLogsSheet();
    const logId = parseInt(params.id);
    const rowIndex = logId + 1; // +1 for header row

    sheet.deleteRow(rowIndex);

    return { success: true, message: 'Log deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===== PROJECTS HANDLERS =====

function handleGetProjects() {
  try {
    const sheet = getProjectsSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = values[0];
    const projects = values.slice(1).map((row, index) => {
      const project = {};
      headers.forEach((header, i) => {
        project[header] = row[i] || '';
      });
      project.id = index + 1;
      return project;
    });

    return { success: true, data: projects };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleCreateProject(params) {
  if (!verifyPassword(params.password)) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    const sheet = getProjectsSheet();
    const newRow = [
      params.name || '',
      params.description || '',
      params.start_date || '',
      params.tech_stack || '',
      params.tags || '',
      'in_progress',
      new Date().toISOString()
    ];

    sheet.appendRow(newRow);

    return { success: true, message: 'Project created successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleUpdateProject(params) {
  if (!verifyPassword(params.password)) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    const sheet = getProjectsSheet();
    const projectId = parseInt(params.id);
    const rowIndex = projectId + 1;

    const range = sheet.getRange(rowIndex, 1, 1, 7);
    range.setValues([[
      params.name || '',
      params.description || '',
      params.start_date || '',
      params.tech_stack || '',
      params.tags || '',
      'in_progress',
      new Date().toISOString()
    ]]);

    return { success: true, message: 'Project updated successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeleteProject(params) {
  if (!verifyPassword(params.password)) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    const sheet = getProjectsSheet();
    const projectId = parseInt(params.id);
    const rowIndex = projectId + 1;

    sheet.deleteRow(rowIndex);

    return { success: true, message: 'Project deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===== HELPER FUNCTIONS =====

function getLogsSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName('Logs');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Logs', 0);
    const headers = ['app_name', 'version', 'summary', 'tags', 'status', 'info', 'date', 'password'];
    sheet.appendRow(headers);
  }

  return sheet;
}

function getProjectsSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName('Projects');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Projects', 1);
    const headers = ['name', 'description', 'start_date', 'tech_stack', 'tags', 'status', 'created_at'];
    sheet.appendRow(headers);
  }

  return sheet;
}

function verifyPassword(password) {
  return password === MASTER_PASSWORD;
}

// ===== TESTING =====

function testGetLogs() {
  const result = handleGetLogs();
  Logger.log(JSON.stringify(result, null, 2));
}

function testCreateLog() {
  const result = handleCreateLog({
    app_name: 'Test App',
    version: '1.0.0',
    summary: 'This is a test log',
    tags: 'feature,testing',
    status: 'completed',
    info: JSON.stringify({ hours: '2', priority: 'high' }),
    password: MASTER_PASSWORD
  });
  Logger.log(JSON.stringify(result, null, 2));
}

function setupSheet() {
  Logger.log('Setting up sheets...');
  getLogsSheet();
  getProjectsSheet();
  Logger.log('Sheets initialized!');
}