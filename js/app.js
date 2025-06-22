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

        $dropArea.on('click', function() {
            // 修正：使用原生 DOM 元素的 click() 方法來避免可能的遞迴問題
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
            $(this).removeClass('border-blue-500 bg-blue-50');
            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                this.handleVideoUpload(files[0]);
            }
        });

        // 選擇檔案按鈕事件
        $('#upload-button').on('click', function() {
            // 修正：使用原生 DOM 元素的 click() 方法來避免可能的遞迴問題
            $videoUploadInput[0].click();
        });

        // 檔案輸入變更事件
        $videoUploadInput.on('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleVideoUpload(e.target.files[0]);
            }
        });

        // "查看歷史數據分析" 按鈕事件
        $('#goto-history-button').on('click', () => {
            this.showHistoryPage();
        });

        // "返回儀表板" 按鈕事件 (歷史頁面)
        $('#back-to-dashboard-button').on('click', () => {
            this.showDashboardPage();
        });

        // 歷史紀錄選單變更事件
        $('#history-record-select').on('change', function() {
            const selectedOption = $(this).find('option:selected');
            const recordData = selectedOption.data('record'); // 獲取儲存在 data 屬性中的 JSON 物件
            UIHandler.displaySelectedRecordDetails(recordData);
            ChartRenderer.renderBiomechanicsRadarChart(recordData ? recordData.biomechanics_features : null);
        });

        // 委託事件：動態生成的 "查看" 按鈕
        $('#history-list').on('click', '.view-history-detail-btn', (e) => {
            const recordId = $(e.currentTarget).data('record-id');
            const record = this.data.historyRecords.find(rec => rec.id === recordId);
            if (record) {
                this.showHistoryPage();
                // 延遲一點點，確保頁面元素渲染完成
                setTimeout(() => {
                    $('#history-record-select').val(record.id).trigger('change');
                }, 100);
            }
        });
    },

    async handleVideoUpload(file) {
        if (!file) return;

        UIHandler.showLoading(`正在上傳 ${file.name} 並分析...`);

        try {
            const data = await ApiService.analyzeVideo(file);
            UIHandler.hideLoading("分析完成！");
            UIHandler.displayVideo(`${ApiService.BASE_URL}/${data.output_video_path}`);
            UIHandler.displayAnalysisResults(data);

            // 將新的分析結果添加到歷史紀錄 (假設後端返回的 data 包含 new_analysis_id)
            if (data.output_video_path && data.max_speed_kmh !== undefined && data.pitch_score !== undefined && data.biomechanics_features) {
                const newRecord = {
                    id: data.new_analysis_id || Date.now(), // 使用後端返回的 ID 或時間戳
                    video_path: data.output_video_path,
                    max_speed_kmh: data.max_speed_kmh,
                    pitch_score: data.pitch_score,
                    biomechanics_features: data.biomechanics_features
                };
                this.data.historyRecords.unshift(newRecord); // 添加到陣列最前面
                UIHandler.addHistoryRecord(newRecord);
            }
        } catch (error) {
            UIHandler.hideLoading(`分析失敗: ${error.message}`);
            alert(`影片分析失敗: ${error.message}`);
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
        UIHandler.displaySelectedRecordDetails(null); // 清空詳細資訊
        ChartRenderer.renderPitchScoreHistogram(this.data.historyRecords);
        ChartRenderer.renderAvgElbowAnglePie(this.data.historyRecords);
        ChartRenderer.renderBiomechanicsRadarChart(null); // 初始化為空
    },

    showDashboardPage() {
        $('#history-analysis-page').addClass('hidden');
        $('#main-dashboard').removeClass('hidden');
    }
};

// DOM 完全載入後初始化應用程式
$(document).ready(function() {
    App.init();
});