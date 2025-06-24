// js/app.js
// 應用程式的主要入口，負責初始化模組和管理主要邏輯
import ApiService from './api.js';
import UIHandler from './ui.js';
import ChartRenderer from './charts.js';

const App = {
    data: {
        historyRecords: [] // 儲存從後端獲取的所有歷史紀錄
    },

    init() {
        UIHandler.init(); // 初始化 UI 處理器

        // 綁定事件監聽器
        this.bindEvents();

        // 初始載入歷史紀錄
        this.loadHistoryRecords();
    },

    bindEvents() {
        // 影片上傳區域拖曳事件
        const $dropArea = $('#drop-area');
        const $videoUploadInput = $('#video-upload');
        const $uploadButton = $('#upload-button');

        $dropArea.on('click', function() {
            $videoUploadInput[0].click();
        });

        $dropArea.on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('border-blue-500 bg-blue-50');
        });

        $dropArea.on('dragleave', function(e) {
            e.preventDefault();
            $(this).removeClass('border-blue-500 bg-blue-50');
        });

        $dropArea.on('drop', (e) => {
            e.preventDefault();
            $(e.currentTarget).removeClass('border-blue-500 bg-blue-50');
            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                $videoUploadInput[0].files = files;
                this.handleVideoUpload(files[0]);
            }
        });

        // 影片選擇事件
        $videoUploadInput.on('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.handleVideoUpload(files[0]);
            }
        });

        // 上傳按鈕點擊事件
        $uploadButton.on('click', async () => {
            const videoFile = $videoUploadInput[0].files[0];
            if (videoFile) {
                try {
                    UIHandler.showLoading();
                    const analysisResult = await ApiService.analyzeVideo(videoFile);
                    UIHandler.displayAnalysisResults(analysisResult);
                    UIHandler.hideLoading("分析完成！");
                    this.loadHistoryRecords(); // 分析完成後重新載入歷史紀錄
                } catch (error) {
                    UIHandler.hideLoading("分析失敗");
                    alert(`影片分析失敗: ${error.message}`);
                }
            } else {
                alert('請先選擇一個影片檔案。');
            }
        });

        // 導航到歷史分析頁面
        $('#show-history-button').on('click', () => {
            this.showHistoryPage();
        });

        // 導航回主儀表板
        $('#show-dashboard-button').on('click', () => {
            this.showDashboardPage();
        });

        // 歷史紀錄下拉選單改變事件
        $('#history-record-select').on('change', (e) => {
            const selectedRecordId = $(e.target).val();
            const selectedRecord = this.data.historyRecords.find(record => record.id == selectedRecordId);
            if (selectedRecord) {
                UIHandler.displaySelectedRecordDetails(selectedRecord);
                ChartRenderer.renderBiomechanicsRadarChart(selectedRecord.biomechanics_features);

                // 根據當前圓餅圖選取器選中的特徵來更新圓餅圖
                const selectedPieFeatureKey = UIHandler.$biomechanicsPieSelect.val();
                if (selectedPieFeatureKey) {
                    const featureName = UIHandler.$biomechanicsPieSelect.find('option:selected').text();
                    ChartRenderer.renderBiomechanicsPieChart(this.data.historyRecords, selectedPieFeatureKey, featureName);
                }
            } else {
                UIHandler.displaySelectedRecordDetails(null);
                ChartRenderer.renderBiomechanicsRadarChart(null);
            }
        });

        // 新增：生物力學圓餅圖選擇器改變事件
        UIHandler.$biomechanicsPieSelect.on('change', (e) => {
            const selectedPieFeatureKey = $(e.target).val();
            const featureName = $(e.target).find('option:selected').text();
            UIHandler.updatePieChartTitle(featureName); // 更新標題

            // 重新繪製圓餅圖
            if (this.data.historyRecords.length > 0) {
                ChartRenderer.renderBiomechanicsPieChart(this.data.historyRecords, selectedPieFeatureKey, featureName);
            } else {
                ChartRenderer.renderBiomechanicsPieChart(null); // 如果沒有數據，清空圖表
            }
        });

        // 歷史紀錄列表點擊事件
        $('#history-list').on('click', 'li', function() {
            const recordId = $(this).data('record-id');
            $('#history-record-select').val(recordId).trigger('change'); // 觸發下拉選單的改變事件
        });
    },

    handleVideoUpload(file) {
        if (file) {
            UIHandler.displayVideo(URL.createObjectURL(file));
            UIHandler.clearAnalysisResults(); // 清除之前的結果
            UIHandler.hideLoading("影片已選取，點擊開始分析");
        }
    },

    async loadHistoryRecords() {
        UIHandler.clearHistoryList(); // 清空現有列表
        try {
            const history = await ApiService.getHistoryData();
            this.data.historyRecords = history; // 儲存所有歷史紀錄

            if (history.length > 0) {
                history.forEach(record => {
                    UIHandler.addHistoryRecord(record);
                });
            } else {
                UIHandler.$noHistoryMessage.removeClass('hidden');
            }
        } catch (error) {
            console.error("載入歷史紀錄失敗:", error);
            alert("載入歷史紀錄失敗，請檢查後端服務。");
            UIHandler.$noHistoryMessage.removeClass('hidden').text('載入歷史紀錄失敗。');
        }
    },

    showHistoryPage() {
        $('#main-dashboard').addClass('hidden');
        $('#history-analysis-page').removeClass('hidden');

        // 載入歷史數據並渲染圖表
        UIHandler.populateHistorySelect(this.data.historyRecords);
        UIHandler.populateBiomechanicsPieSelect(); // 填充圓餅圖特徵選擇器

        UIHandler.displaySelectedRecordDetails(null); // 清空詳細資訊
        ChartRenderer.renderPitchScoreHistogram(this.data.historyRecords);
        // 預設渲染第一個特徵的圓餅圖
        if (this.data.historyRecords.length > 0 && UIHandler.$biomechanicsPieSelect.val()) {
            const selectedPieFeatureKey = UIHandler.$biomechanicsPieSelect.val();
            const featureName = UIHandler.$biomechanicsPieSelect.find('option:selected').text();
            ChartRenderer.renderBiomechanicsPieChart(this.data.historyRecords, selectedPieFeatureKey, featureName);
        } else {
            ChartRenderer.renderBiomechanicsPieChart(null); // 無數據時清空
        }
        ChartRenderer.renderBiomechanicsRadarChart(null); // 初始化為空
    },

    showDashboardPage() {
        $('#history-analysis-page').addClass('hidden');
        $('#main-dashboard').removeClass('hidden');
    }
};

$(document).ready(() => {
    App.init();
});