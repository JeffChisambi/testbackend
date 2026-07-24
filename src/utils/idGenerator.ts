const year = () => new Date().getFullYear();
const rand = (n: number) => Math.floor(Math.random() * n);
const ts = () => Date.now().toString().slice(-6);

export const generateFarmerId  = () => `FARM-${year()}-${String(rand(90000) + 10000)}`;
export const generatePurchaseRef = () => `PUR-${year()}-${ts()}-${String(rand(900) + 100)}`;
export const generateGrnNumber   = () => `GRN-${year()}-${ts()}`;
export const generateDeliveryRef = () => `DEL-${year()}-${ts()}`;
export const generateLoanRef     = () => `LOAN-${year()}-${ts()}`;
