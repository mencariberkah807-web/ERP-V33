const STORAGE_KEY = "artkrilik_work_orders";

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const workOrderStore = {
  getWorkOrders() {
    return read();
  },
  addWorkOrder(workOrder) {
    const records = read();
    records.push(workOrder);
    write(records);
    return workOrder;
  },
  replaceWorkOrders(workOrders) {
    write(workOrders);
    return workOrders;
  },
};
