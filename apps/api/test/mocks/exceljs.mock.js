class MockWorksheet {
  constructor() {
    this.columns = [];
  }

  addRow() {
    return {};
  }
}

class MockWorkbook {
  constructor() {
    this.xlsx = {
      writeBuffer: async () => Buffer.from(''),
    };
  }

  addWorksheet() {
    return new MockWorksheet();
  }
}

const ExcelJS = {
  Workbook: MockWorkbook,
};

module.exports = ExcelJS;
module.exports.default = ExcelJS;
