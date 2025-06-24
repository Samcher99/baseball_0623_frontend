// js/charts.js
// 負責繪製各種統計圖表的模組
const ChartRenderer = {
    charts: {}, // 儲存 Chart 實例，方便更新或銷毀

    renderPitchScoreHistogram(data) {
        if (this.charts.pitchScoreHistogram) {
            this.charts.pitchScoreHistogram.destroy();
        }
        const ctx = document.getElementById('pitchScoreHistogramChart').getContext('2d');
        // 假設分數範圍是 0-9
        const counts = Array(10).fill(0); // 0到9共10個區間
        data.forEach(record => {
            if (record.pitch_score !== null && record.pitch_score >= 0 && record.pitch_score <= 9) {
                counts[record.pitch_score]++;
            }
        });

        this.charts.pitchScoreHistogram = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 10}, (_, i) => `${i}分`), // 標籤：0分, 1分, ..., 9分
                datasets: [{
                    label: '投球分數分佈',
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '紀錄數量'
                        },
                        ticks: {
                            precision: 0 // 確保Y軸刻度是整數
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '投球分數'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '所有歷史紀錄的投球分數分佈'
                    }
                }
            }
        });
    },

    // 新的圓餅圖函數，可以根據選擇的特徵繪製
    renderBiomechanicsPieChart(data, featureKey, featureName) {
        if (this.charts.biomechanicsPie) {
            this.charts.biomechanicsPie.destroy();
        }

        const ctx = document.getElementById('biomechanicsPieChart').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // 清空畫布

        if (!data || data.length === 0 || !featureKey) {
            return;
        }

        // 定義每個特徵的分類閾值和標籤
        // 您需要根據每個特徵的實際意義和理想範圍來設定這些閾值
        const featureThresholds = {
            'Trunk_flexion_excursion': {
                labels: ['過低 (<60°)', '理想 (60°-75°)', '過高 (>75°)'],
                ranges: [[-Infinity, 59.99], [60, 75], [75.01, Infinity]]
            },
            'Pelvis_obliquity_at_FC': {
                labels: ['過低 (< -2°)', '理想 (-2°-2°)', '過高 (> 2°)'],
                ranges: [[-Infinity, -2.01], [-2, 2], [2.01, Infinity]]
            },
            'Trunk_rotation_at_BR': {
                labels: ['過低 (<140°)', '理想 (140°-170°)', '過高 (>170°)'],
                ranges: [[-Infinity, 139.99], [140, 170], [170.01, Infinity]]
            },
            'Shoulder_abduction_at_BR': {
                labels: ['過低 (<140°)', '理想 (140°-160°)', '過高 (>160°)'],
                ranges: [[-Infinity, 139.99], [140, 160], [160.01, Infinity]]
            },
            'Trunk_flexion_at_BR': {
                labels: ['過低 (>-55°)', '理想 (-75°--55°)', '過高 (<-75°)'], // 注意負值判斷
                ranges: [[-54.99, Infinity], [-75, -55], [-Infinity, -75.01]]
            },
            'Trunk_lateral_flexion_at_HS': {
                labels: ['過低 (< -2°)', '理想 (-2°-2°)', '過高 (> 2°)'],
                ranges: [[-Infinity, -2.01], [-2, 2], [2.01, Infinity]]
            }
            // 由於 release_frame 等是計數，通常不適合用這種「過低/理想/過高」的分類，
            // 如果要納入，需要單獨定義其分類邏輯或以其他方式呈現。
        };

        const config = featureThresholds[featureKey];
        if (!config) {
            console.warn(`未找到特徵 ${featureKey} 的圓餅圖配置。`);
            return;
        }

        const counts = new Array(config.labels.length).fill(0);
        data.forEach(record => {
            const value = record.biomechanics_features ? record.biomechanics_features[featureKey] : null;
            if (value !== null && value !== undefined) {
                for (let i = 0; i < config.ranges.length; i++) {
                    const [min, max] = config.ranges[i];
                    if (value >= min && value <= max) {
                        counts[i]++;
                        break;
                    }
                }
            }
        });

        this.charts.biomechanicsPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: config.labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // 紅、藍、黃
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `${featureName}分佈` // 動態標題
                    }
                }
            }
        });
    },

    renderBiomechanicsRadarChart(selectedRecordFeatures) {
        if (this.charts.biomechanicsRadar) {
            this.charts.biomechanicsRadar.destroy();
        }
        const ctx = document.getElementById('biomechanicsRadarChart').getContext('2d');

        if (!selectedRecordFeatures) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // 清空畫布
            return;
        }

        // 定義各特徵的理想值範圍 (用於標準化或視覺比較)
        // 這些值應該與 ClassificationModel.py 中的判斷標準相符
        // *** 這裡需要根據新的 biomechanics_features 重新定義理想範圍和標籤 ***
        // 排除 'release_frame', 'landing_frame', 'shoulder_frame', 'total_frames'
        const idealRanges = {
            'Trunk_flexion_excursion': { min: 60, max: 75, label: '軀幹屈曲偏移', unit: '度' }, // 假設理想範圍
            'Pelvis_obliquity_at_FC': { min: -2, max: 2, label: '骨盆傾斜@FC', unit: '度' }, // 假設理想接近0
            'Trunk_rotation_at_BR': { min: 140, max: 170, label: '軀幹旋轉@BR', unit: '度' }, // 假設理想範圍
            'Shoulder_abduction_at_BR': { min: 140, max: 160, label: '肩膀外展@BR', unit: '度' }, // 假設理想範圍
            'Trunk_flexion_at_BR': { min: -75, max: -55, label: '軀幹屈曲@BR', unit: '度' }, // 假設理想負值範圍
            'Trunk_lateral_flexion_at_HS': { min: -2, max: 2, label: '軀幹側屈@HS', unit: '度' }, // 假設理想接近0
        };

        const labels = Object.values(idealRanges).map(r => r.label);
        const dataValues = [];
        const pointBackgroundColors = [];
        const pointBorderColors = [];

        for (const key in idealRanges) {
            const featureValue = selectedRecordFeatures[key];
            const range = idealRanges[key];

            if (featureValue === null || featureValue === undefined) {
                dataValues.push(0); // 缺失值設為0，或根據需要處理
                pointBackgroundColors.push('rgba(128, 128, 128, 0.4)'); // 灰色表示缺失
                pointBorderColors.push('rgba(128, 128, 128, 1)');
                continue;
            }

            let normalizedValue;
            if (key === 'Pelvis_obliquity_at_FC' || key === 'Trunk_lateral_flexion_at_HS') {
                // 這些值理想情況下接近 0，越接近 0 越好
                const max_abs_deviation = Math.max(Math.abs(range.min), Math.abs(range.max), 1); // 避免除以0
                normalizedValue = 1 - (Math.abs(featureValue) / max_abs_deviation);
                normalizedValue = Math.max(0, Math.min(1, normalizedValue)); // 確保在 0 到 1 之間
            } else {
                // 對於有最佳範圍的指標，計算其在範圍內的接近度
                // 標準化到 0-1 範圍，1 表示在理想範圍內，0 表示非常偏離
                if (featureValue >= range.min && featureValue <= range.max) {
                    normalizedValue = 1; // 在理想範圍內
                } else {
                    const deviation = Math.min(Math.abs(featureValue - range.min), Math.abs(featureValue - range.max));
                    const max_possible_deviation = Math.max(Math.abs(range.min), Math.abs(range.max)); // 用最大可能偏差來正規化
                    normalizedValue = 1 - (deviation / max_possible_deviation);
                    normalizedValue = Math.max(0, Math.min(1, normalizedValue)); // 確保在 0 到 1 之間
                }
            }
            dataValues.push(normalizedValue);

            // 根據正規化後的值給顏色
            if (normalizedValue >= 0.8) {
                pointBackgroundColors.push('rgba(75, 192, 192, 0.6)'); // 綠色 - 很好
                pointBorderColors.push('rgba(75, 192, 192, 1)');
            } else if (normalizedValue >= 0.5) {
                pointBackgroundColors.push('rgba(255, 206, 86, 0.6)'); // 黃色 - 尚可
                pointBorderColors.push('rgba(255, 206, 86, 1)');
            } else {
                pointBackgroundColors.push('rgba(255, 99, 132, 0.6)'); // 紅色 - 需改善
                pointBorderColors.push('rgba(255, 99, 132, 1)');
            }
        }

        this.charts.biomechanicsRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '選定紀錄的運動力學表現',
                    data: dataValues,
                    backgroundColor: 'rgba(153, 102, 255, 0.4)', // 統一填充色
                    borderColor: 'rgba(153, 102, 255, 1)', // 統一邊框色
                    pointBackgroundColor: pointBackgroundColors, // 每個點的顏色
                    pointBorderColor: pointBorderColors,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(153, 102, 255, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        angleLines: {
                            color: '#e0e0e0' // 網格線顏色
                        },
                        grid: {
                            color: '#e0e0e0'
                        },
                        pointLabels: {
                            font: {
                                size: 14
                            },
                            color: '#333'
                        },
                        ticks: {
                            min: 0,
                            max: 1,
                            stepSize: 0.2,
                            display: false // 不顯示刻度數值
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '運動力學特徵表現 (正規化值，1為理想)'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const featureKeys = Object.keys(idealRanges); // 使用 idealRanges 的 key
                                const featureName = featureKeys[context.dataIndex];
                                const originalValue = selectedRecordFeatures[featureName];
                                const unit = idealRanges[featureName] ? idealRanges[featureName].unit : '';
                                return `${label} ${context.formattedValue} (原始值: ${originalValue !== null && originalValue !== undefined ? originalValue.toFixed(2) : 'N/A'} ${unit})`;
                            }
                        }
                    }
                }
            }
        });
    }
};

export default ChartRenderer;