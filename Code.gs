function doGet(e) {
    return HtmlService.createHtmlOutputFromFile('Index')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function login(id, password) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('FUNCIONARIOS');
    const data = sheet.getDataRange().getValues();

    const lowerCaseId = id.toLowerCase();
    const lowerCasePassword = password.toLowerCase();

    for (let i = 1; i < data.length; i++) {
        const sheetId = data[i][4] ? data[i][4].toString().toLowerCase() : '';
        const sheetPassword = data[i][5] ? data[i][5].toString().toLowerCase() : '';

        if (sheetId === lowerCaseId && sheetPassword === lowerCasePassword) {
            const fullName = data[i][1];
            createUserSheet(id, fullName);
            createTimeTrigger(id);
            checkAndCreateNewRow(id, fullName);
            return fullName;
        }
    }

    throw new Error('ID ou senha incorretos');
}

function createUserSheet(id, fullName) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const baseSheet = spreadsheet.getSheetByName('BASE');

    let userSheet = spreadsheet.getSheetByName(id);

    if (!userSheet) {
        userSheet = baseSheet.copyTo(spreadsheet);
        userSheet.setName(id);
    }
}

function checkAndCreateNewRow(id, fullName) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const userSheet = spreadsheet.getSheetByName(id);

    const lastRow = userSheet.getLastRow();
    if (lastRow > 1) {
        const lastRowData = userSheet.getRange(lastRow, 1, 1, 7).getValues()[0];
        if (lastRowData[5] !== '') {  // Se "Total de Horas do Dia" está preenchido
            const date = new Date();
            const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
            userSheet.appendRow([formattedDate, fullName, '', '', '', '', 0]);
        }
    }
}

function logTime(action, time, id, fullName) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const userSheet = spreadsheet.getSheetByName(id);

    const date = new Date();
    const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const formattedTime = Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm:ss');

    const lastRow = userSheet.getLastRow();
    const lastRowData = userSheet.getRange(lastRow, 1, 1, 7).getValues()[0];

    if (action === 'start') {
        if (lastRowData[2] === '') {
            userSheet.getRange(lastRow, 3).setValue(formattedTime);
        } else if (lastRowData[5] !== '') {
            userSheet.appendRow([formattedDate, fullName, formattedTime, '', '', '', 0]);
        } else {
            // Limpa a coluna "Pausa" se o usuário estiver retornando do intervalo
            if (lastRowData[3] !== '') {
                userSheet.getRange(lastRow, 4).setValue('');
            }
        }
    } else if (action === 'interval') {
        userSheet.getRange(lastRow, 4).setValue(formattedTime);
    } else if (action === 'stop') {
        userSheet.getRange(lastRow, 5).setValue(formattedTime);
        userSheet.getRange(lastRow, 6).setValue(time);
        userSheet.getRange(lastRow, 7).setValue(0);
    }

    centralizeSheet(userSheet);
}

function logProjectTime(action, time, id, projectName, fullName) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const projectSheet = spreadsheet.getSheetByName('HORAS_POR_PROJETO');

    const date = new Date();
    const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const formattedTime = Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm:ss');

    const lastRow = projectSheet.getLastRow();
    const lastRowData = projectSheet.getRange(lastRow, 1, 1, 8).getValues()[0];

    if (action === 'start') {
        if (lastRowData[4] === '' || lastRowData[7] !== '') {
            projectSheet.appendRow([formattedDate, fullName, id, projectName, formattedTime, '', '', '']);
        } else {
            return;
        }
    } else if (action === 'interval') {
        projectSheet.getRange(lastRow, 6).setValue(formattedTime);
    } else if (action === 'stop') {
        projectSheet.getRange(lastRow, 7).setValue(formattedTime);
        projectSheet.getRange(lastRow, 8).setValue(time);
    }

    centralizeSheet(projectSheet);
}

function centralizeSheet(sheet) {
    var range = sheet.getDataRange();
    range.setHorizontalAlignment('center');
    range.setVerticalAlignment('middle');
}

function getProjects() {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('PROJETOS');
    const data = sheet.getDataRange().getValues();
    const projects = [];

    for (let i = 1; i < data.length; i++) {
        const projectName = data[i][2];
        const clientName = data[i][1];
        projects.push(`${projectName} - ${clientName}`);
    }

    return projects;
}

function getLastRealTime(id) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const userSheet = spreadsheet.getSheetByName(id);

    const lastRow = userSheet.getLastRow();
    const lastRowData = userSheet.getRange(lastRow, 1, 1, 7).getValues()[0];

    if (lastRowData[5] === '') {
        return lastRowData[6];
    }

    return 0;
}

function saveRealTime(id, realTime) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const userSheet = spreadsheet.getSheetByName(id);

    const lastRow = userSheet.getLastRow();
    userSheet.getRange(lastRow, 7).setValue(realTime);
}

function updateRealTime(id) {
    const sheetId = '1RWRz_vewPvI2rznmzOlH57ysJk8vQ6H33oyVKCnoXwo';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const userSheet = spreadsheet.getSheetByName(id);

    const lastRow = userSheet.getLastRow();
    if (lastRow > 1) {
        const lastRowData = userSheet.getRange(lastRow, 1, 1, 7).getValues()[0];
        if (lastRowData[2] !== '' && lastRowData[5] === '') {
            // Verifica se a coluna "Pausa" (índice 3) está em branco
            if (lastRowData[3] === '') {
                const realTime = lastRowData[6] !== '' ? parseFloat(lastRowData[6]) : 0;
                const newRealTime = realTime + 60;  // Adiciona 60 segundos
                userSheet.getRange(lastRow, 7).setValue(newRealTime);
                return newRealTime;  // Retorna o novo valor de tempo real
            }
        }
    }
    return null;  // Retorna null se não houver atualização
}

function createTimeTrigger(id) {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }

    ScriptApp.newTrigger('triggerUpdateRealTime')
        .timeBased()
        .everyMinutes(1)
        .create();

    PropertiesService.getScriptProperties().setProperty('currentUserId', id);
}

function triggerUpdateRealTime() {
    const id = PropertiesService.getScriptProperties().getProperty('currentUserId');
    if (id) {
        const newRealTime = updateRealTime(id);
        if (newRealTime !== null) {
            // Aqui você pode adicionar lógica para notificar o cliente sobre a atualização
            // Por exemplo, você pode armazenar o novo valor em uma propriedade do script
            PropertiesService.getScriptProperties().setProperty('lastUpdatedRealTime', newRealTime.toString());
        }
    }
}

function checkForUpdates() {
    const lastUpdatedRealTime = PropertiesService.getScriptProperties().getProperty('lastUpdatedRealTime');
    if (lastUpdatedRealTime) {
        PropertiesService.getScriptProperties().deleteProperty('lastUpdatedRealTime');
        return parseFloat(lastUpdatedRealTime);
    }
    return null;
}