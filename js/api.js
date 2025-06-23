// js/api.js
// 負責與後端 API 進行互動的模組
const ApiService = {
    BASE_URL: "https://b410-43-207-222-55.ngrok-free.app", // 您的 FastAPI 後端位址，部署後請修改

    async analyzeVideo(file) {
        const formData = new FormData();
        formData.append("video_file", file);
        try {
            const response = await fetch(`${this.BASE_URL}/analyze-pitch/`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP 錯誤! 狀態碼: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("影片分析失敗:", error);
            throw error;
        }
    },

    async getHistoryData() {
        try {
            const response = await fetch(`${this.BASE_URL}/history/`); // 注意這裡有尾隨斜線
            if (!response.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("獲取歷史紀錄失敗:", error);
            return []; // 返回空陣列以避免應用程式崩潰
        }
    }
};

export default ApiService;
