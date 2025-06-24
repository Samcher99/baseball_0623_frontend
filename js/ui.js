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
        this.$viewDetailsButton = $('#view-details-button'); // 這個按鈕在新的設計中可能不需要，但先保留

        // 新增 biomechanics features 的 DOM 引用
        this.$releaseFrame = $('#release_frame');
        this.$landingFrame = $('#landing_frame');
        this.$shoulderFrame = $('#shoulder_frame');
        this.$totalFrames = $('#total_frames');
        this.$trunkFlexionExcursion = $('#trunk_flexion_excursion');
        this.$pelvisObliquityAtFC = $('#pelvis_obliquity_at_fc');
        this.$trunkRotationAtBR = $('#trunk_rotation_at_br');
        this.$shoulderAbductionAtBR = $('#shoulder_abduction_at_br');
        this.$trunkFlexionAtBR = $('#trunk_flexion_at_br');
        this.$trunkLateralFlexionAtHS = $('#trunk_lateral_flexion_at_hs');

        // 新增圓餅圖特徵選擇器引用
        this.$biomechanicsPieSelect = $('#biomechanics-pie-select');
        this.$pieChartTitle = $('#pie-chart-title');
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
        this.$videoPlayer[0].src = videoUrl;
        this.$videoPlayer[0].load();
        this.$videoPlayerMessage.text('影片載入成功，正在等待分析結果...');
    },

    displayAnalysisResults(results) {
        this.$maxSpeed.text(results.max_speed_kmh.toFixed(2));
        this.$pitchScore.text(results.pitch_score);

        // 更新運動力學特徵
        const features = results.biomechanics_features;
        this.$releaseFrame.text(features.release_frame !== null ? features.release_frame : 'N/A');
        this.$landingFrame.text(features.landing_frame !== null ? features.landing_frame : 'N/A');
        this.$shoulderFrame.text(features.shoulder_frame !== null ? features.shoulder_frame : 'N/A');
        this.$totalFrames.text(features.total_frames !== null ? features.total_frames : 'N/A');
        this.$trunkFlexionExcursion.text(features.Trunk_flexion_excursion !== null ? features.Trunk_flexion_excursion.toFixed(2) : 'N/A');
        this.$pelvisObliquityAtFC.text(features.Pelvis_obliquity_at_FC !== null ? features.Pelvis_obliquity_at_FC.toFixed(2) : 'N/A');
        this.$trunkRotationAtBR.text(features.Trunk_rotation_at_BR !== null ? features.Trunk_rotation_at_BR.toFixed(2) : 'N/A');
        this.$shoulderAbductionAtBR.text(features.Shoulder_abduction_at_BR !== null ? features.Shoulder_abduction_at_BR.toFixed(2) : 'N/A');
        this.$trunkFlexionAtBR.text(features.Trunk_flexion_at_BR !== null ? features.Trunk_flexion_at_BR.toFixed(2) : 'N/A');
        this.$trunkLateralFlexionAtHS.text(features.Trunk_lateral_flexion_at_HS !== null ? features.Trunk_lateral_flexion_at_HS.toFixed(2) : 'N/A');

        // this.$viewDetailsButton.removeClass('hidden'); // 顯示查看詳細分析按鈕 (如果還需要)
    },

    clearAnalysisResults() {
        this.$maxSpeed.text('N/A');
        this.$pitchScore.text('N/A');
        this.$releaseFrame.text('N/A');
        this.$landingFrame.text('N/A');
        this.$shoulderFrame.text('N/A');
        this.$totalFrames.text('N/A');
        this.$trunkFlexionExcursion.text('N/A');
        this.$pelvisObliquityAtFC.text('N/A');
        this.$trunkRotationAtBR.text('N/A');
        this.$shoulderAbductionAtBR.text('N/A');
        this.$trunkFlexionAtBR.text('N/A');
        this.$trunkLateralFlexionAtHS.text('N/A');
        this.$videoPlayer[0].src = '';
        this.$videoPlayerMessage.text('影片將在此處播放，並顯示關鍵影格。');
        // this.$viewDetailsButton.addClass('hidden');
    },

    addHistoryRecord(record) {
        this.$noHistoryMessage.addClass('hidden');
        const $li = $(`
            <li class="py-3 sm:py-4 px-4 hover:bg-gray-50 cursor-pointer" data-record-id="${record.id}">
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <img class="w-12 h-12 rounded-full object-cover" src="https://via.placeholder.com/50" alt="Placeholder">
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            紀錄 #${record.id}
                        </p>
                        <p class="text-sm text-gray-500 truncate">
                            分析於: ${new Date(record.analysis_date).toLocaleString()}
                        </p>
                    </div>
                    <div class="inline-flex items-center text-base font-semibold text-gray-900">
                        球速: ${record.max_speed_kmh.toFixed(2)} km/h, 評分: ${record.pitch_score}
                    </div>
                </div>
            </li>
        `);
        this.$historyList.append($li);
    },

    clearHistoryList() {
        this.$historyList.empty();
        this.$noHistoryMessage.removeClass('hidden').text('暫無歷史紀錄。');
    },

    populateHistorySelect(records) {
        const $select = $('#history-record-select');
        $select.empty();
        $select.append($('<option>', {
            value: '',
            text: '請選擇一個歷史紀錄',
            disabled: true,
            selected: true
        }));
        records.forEach(record => {
            $select.append($('<option>', {
                value: record.id,
                text: `紀錄 #${record.id} (${new Date(record.analysis_date).toLocaleString()} - ${record.max_speed_kmh.toFixed(2)} km/h)`,
                data: record // 將整個 record 物件儲存在 option 的 data 屬性中
            }));
        });
    },

    populateBiomechanicsPieSelect() {
        const $select = this.$biomechanicsPieSelect;
        $select.empty();
        // 定義可以顯示圓餅圖的生物力學特徵及其中文名稱
        const pieChartFeatures = {
            'Trunk_flexion_excursion': '軀幹屈曲偏移',
            'Pelvis_obliquity_at_FC': '骨盆傾斜於FC',
            'Trunk_rotation_at_BR': '軀幹旋轉於BR',
            'Shoulder_abduction_at_BR': '肩膀外展於BR',
            'Trunk_flexion_at_BR': '軀幹屈曲於BR',
            'Trunk_lateral_flexion_at_HS': '軀幹側向屈曲於HS'
        };

        for (const key in pieChartFeatures) {
            $select.append($('<option>', {
                value: key,
                text: pieChartFeatures[key]
            }));
        }
        // 預設選擇第一個，並更新標題
        if (Object.keys(pieChartFeatures).length > 0) {
            $select.val(Object.keys(pieChartFeatures)[0]);
            this.updatePieChartTitle(pieChartFeatures[Object.keys(pieChartFeatures)[0]]);
        }
    },

    updatePieChartTitle(featureName) {
        this.$pieChartTitle.text(`${featureName}分佈 (圓餅圖)`);
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
                <li>釋放影格: ${features.release_frame !== null ? features.release_frame : 'N/A'}</li>
                <li>著地影格: ${features.landing_frame !== null ? features.landing_frame : 'N/A'}</li>
                <li>肩膀影格: ${features.shoulder_frame !== null ? features.shoulder_frame : 'N/A'}</li>
                <li>總影格數: ${features.total_frames !== null ? features.total_frames : 'N/A'}</li>
                <li>軀幹屈曲偏移: ${features.Trunk_flexion_excursion !== null ? features.Trunk_flexion_excursion.toFixed(2) : 'N/A'}</li>
                <li>骨盆傾斜於FC: ${features.Pelvis_obliquity_at_FC !== null ? features.Pelvis_obliquity_at_FC.toFixed(2) : 'N/A'}</li>
                <li>軀幹旋轉於BR: ${features.Trunk_rotation_at_BR !== null ? features.Trunk_rotation_at_BR.toFixed(2) : 'N/A'}</li>
                <li>肩膀外展於BR: ${features.Shoulder_abduction_at_BR !== null ? features.Shoulder_abduction_at_BR.toFixed(2) : 'N/A'}</li>
                <li>軀幹屈曲於BR: ${features.Trunk_flexion_at_BR !== null ? features.Trunk_flexion_at_BR.toFixed(2) : 'N/A'}</li>
                <li>軀幹側向屈曲於HS: ${features.Trunk_lateral_flexion_at_HS !== null ? features.Trunk_lateral_flexion_at_HS.toFixed(2) : 'N/A'}</li>
            </ul>
        `);
    }
};

export default UIHandler;