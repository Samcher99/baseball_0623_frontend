// js/ui.js
// 負責更新頁面元素和處理 DOM 操作的模組
const UIHandler = {
    init() {
        this.$uploadStatus = $('#upload-status');
        this.$loadingSpinner = $('#loading-spinner');
        this.$videoPlayer = $('#video-player');
        this.$videoPlayerMessage = $('#video-player-message');
        this.$maxSpeed = $('#max-speed');
        this.$pitchScore = $('#pitch-score');
        this.$biomechanicsResults = $('#biomechanics-results');
        this.$historyList = $('#history-list');
        this.$noHistoryMessage = $('#no-history-message');
        this.$viewDetailsButton = $('#view-details-button');
    },

    showLoading(message = "正在上傳並分析影片，請稍候...") {
        this.$uploadStatus.text(message).removeClass('text-gray-600').addClass('text-blue-500 font-medium');
        this.$loadingSpinner.removeClass('hidden');
        $('#upload-button').prop('disabled', true);
    },

    hideLoading(message = "") {
        this.$uploadStatus.text(message).removeClass('text-blue-500 font-medium').addClass('text-gray-600');
        this.$loadingSpinner.addClass('hidden');
        $('#upload-button').prop('disabled', false);
    },

    displayVideo(videoUrl) {
    this.$videoPlayer[0].src = videoUrl;             // ✅ 正確設 src
    this.$videoPlayer[0].load();                     // 重新載入影片
    this.$videoPlayerMessage.addClass('hidden');     // 隱藏提示訊息
    this.$videoPlayer[0].play();                     // 自動播放
    },

    displayAnalysisResults(results) {
        this.$maxSpeed.text(results.max_speed_kmh.toFixed(2));
        this.$pitchScore.text(results.pitch_score);

        // 更新運動力學特徵
        const features = results.biomechanics_features;
        $('#avg_elbow_angle').text(features.avg_elbow_angle !== null ? features.avg_elbow_angle.toFixed(2) : 'N/A');
        $('#avg_shoulder_slope_deg').text(features.avg_shoulder_slope_deg !== null ? features.avg_shoulder_slope_deg.toFixed(2) : 'N/A');
        $('#avg_hip_slope_deg').text(features.avg_hip_slope_deg !== null ? features.avg_hip_slope_deg.toFixed(2) : 'N/A');
        $('#avg_torso_twist_deg').text(features.avg_torso_twist_deg !== null ? features.avg_torso_twist_deg.toFixed(2) : 'N/A');
        $('#max_hand_speed_px_per_s').text(features.max_hand_speed_px_per_s !== null ? features.max_hand_speed_px_per_s.toFixed(2) : 'N/A');
        $('#max_stride_length_px').text(features.max_stride_length_px !== null ? features.max_stride_length_px.toFixed(2) : 'N/A');
        $('#min_elbow_height_px').text(features.min_elbow_height_px !== null ? features.min_elbow_height_px.toFixed(2) : 'N/A');
        $('#avg_head_elbow_dist_px').text(features.avg_head_elbow_dist_px !== null ? features.avg_head_elbow_dist_px.toFixed(2) : 'N/A');
        $('#avg_shoulder_width_px').text(features.avg_shoulder_width_px !== null ? features.avg_shoulder_width_px.toFixed(2) : 'N/A');

        this.$viewDetailsButton.removeClass('hidden'); // 顯示查看詳細分析按鈕
    },

    addHistoryRecord(record) {
        this.$noHistoryMessage.addClass('hidden'); // 隱藏 "暫無歷史紀錄"
        const recordItem = `
            <div class="bg-gray-100 p-3 rounded-md border border-gray-200 flex justify-between items-center text-sm">
                <span>紀錄 #${record.id} - 球速: ${record.max_speed_kmh.toFixed(2)} km/h, 評分: ${record.pitch_score}</span>
                <button class="view-history-detail-btn bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded" data-record-id="${record.id}">查看</button>
            </div>
        `;
        this.$historyList.prepend(recordItem); // 新紀錄顯示在最上面
    },

    clearHistoryList() {
        this.$historyList.empty();
        this.$historyList.append('<p class="text-gray-500 text-center py-4" id="no-history-message">暫無歷史紀錄。</p>');
        this.$noHistoryMessage = $('#no-history-message'); // 重新獲取引用
    },

    populateHistorySelect(historyData) {
        const $select = $('#history-record-select');
        $select.empty();
        if (historyData.length === 0) {
            $select.append('<option value="">沒有可用的歷史紀錄</option>');
            return;
        }
        $select.append('<option value="">請選擇一個紀錄</option>');
        historyData.forEach(record => {
            $select.append(`<option value="${record.id}" data-record='${JSON.stringify(record)}'>紀錄 #${record.id} - ${record.max_speed_kmh.toFixed(1)} km/h (${record.pitch_score}分)</option>`);
        });
    },

    displaySelectedRecordDetails(record) {
        const $detailsDiv = $('#selected-record-details');
        if (!record) {
            $detailsDiv.html('<p class="text-center text-gray-500">請從上方下拉選單選擇一個歷史紀錄。</p>');
            return;
        }
        const features = record.biomechanics_features;
        $detailsDiv.html(`
            <h3 class="font-bold text-lg mb-2">選定紀錄 #${record.id}</h3>
            <p><strong>球速:</strong> ${record.max_speed_kmh.toFixed(2)} km/h</p>
            <p><strong>投球評分:</strong> ${record.pitch_score} / 9</p>
            <h4 class="font-semibold mt-3 mb-1">運動力學特徵:</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>平均手肘角度: ${features.avg_elbow_angle !== null ? features.avg_elbow_angle.toFixed(2) : 'N/A'} 度</li>
                <li>平均肩膀傾斜角度: ${features.avg_shoulder_slope_deg !== null ? features.avg_shoulder_slope_deg.toFixed(2) : 'N/A'} 度</li>
                <li>平均髖部傾斜角度: ${features.avg_hip_slope_deg !== null ? features.avg_hip_slope_deg.toFixed(2) : 'N/A'} 度</li>
                <li>平均軀幹扭轉角度: ${features.avg_torso_twist_deg !== null ? features.avg_torso_twist_deg.toFixed(2) : 'N/A'} 度</li>
                <li>最大手部速度: ${features.max_hand_speed_px_per_s !== null ? features.max_hand_speed_px_per_s.toFixed(2) : 'N/A'} 像素/秒</li>
                <li>最大步幅: ${features.max_stride_length_px !== null ? features.max_stride_length_px.toFixed(2) : 'N/A'} 像素</li>
                <li>最小手肘高度: ${features.min_elbow_height_px !== null ? features.min_elbow_height_px.toFixed(2) : 'N/A'} 像素</li>
                <li>平均頭肘距離: ${features.avg_head_elbow_dist_px !== null ? features.avg_head_elbow_dist_px.toFixed(2) : 'N/A'} 像素</li>
                <li>平均肩膀寬度: ${features.avg_shoulder_width_px !== null ? features.avg_shoulder_width_px.toFixed(2) : 'N/A'} 像素</li>
            </ul>
        `);
    }
};

export default UIHandler;