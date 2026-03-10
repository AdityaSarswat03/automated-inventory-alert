import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000/api" });

export const fetchProducts = () => API.get("/products");
export const createProduct = (data) => API.post("/products", data);
export const updateStock = (id, quantity) =>
  API.patch(`/products/${id}/stock`, { quantity });
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const fetchAlerts = () => API.get("/alerts");
export const generateReport = (fmt = "csv") =>
  API.post(`/reports?fmt=${fmt}`);
export const getReportDownloadUrl = (filename) =>
  `http://localhost:8000/api/reports/download/${encodeURIComponent(filename)}`;
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/products/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
