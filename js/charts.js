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
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '紀錄數量'
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
                        display: false
                    }
                }
            }
        });
    },

    renderAvgElbowAnglePie(data) {
        if (this.charts.avgElbowAnglePie) {
            this.charts.avgElbowAnglePie.destroy();
        }
        const ctx = document.getElementById('avgElbowAnglePieChart').getContext('2d');

        // 簡單分類手肘角度區間
        let goodCount = 0; // 80-120
        let avgCount = 0; // 其他合理區間
        let badCount = 0; // 超出合理範圍

        data.forEach(record => {
            const angle = record.biomechanics_features.avg_elbow_angle;
            if (angle === null) return; // 排除空值
            if (angle >= 80 && angle <= 120) {
                goodCount++;
            } else if (angle > 50 && angle < 150) { // 稍微放寬的合理區間
                avgCount++;
            } else {
                badCount++;
            }
        });

        this.charts.avgElbowAnglePie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['理想角度 (80-120°)', '可接受角度', '需改善角度'],
                datasets: [{
                    data: [goodCount, avgCount, badCount],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)', // Good
                        'rgba(255, 206, 86, 0.6)', // Average
                        'rgba(255, 99, 132, 0.6)'  // Bad
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '平均手肘角度分佈'
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
        const idealRanges = {
            'avg_elbow_angle': { min: 80, max: 120, label: '手肘角度' },
            'avg_shoulder_slope_deg': { min: 80, max: 100, label: '肩膀傾斜' },
            'avg_hip_slope_deg': { min: 70, max: 100, label: '髖部傾斜' },
            'avg_torso_twist_deg': { min: 40, max: 90, label: '軀幹扭轉' },
            'max_hand_speed_px_per_s': { min: 1000, max: 5000, label: '最大手速' },
            'max_stride_length_px': { min: 100, max: 500, label: '最大步幅' }, // 假設上限
            'min_elbow_height_px': { min: 200, max: 800, label: '最小肘高' }, // 假設上限
            'avg_head_elbow_dist_px': { min: 50, max: 120, label: '頭肘距離' },
            'avg_shoulder_width_px': { min: 40, max: 200, label: '肩膀寬度' }, // 假設上限
        };

        const labels = Object.values(idealRanges).map(r => r.label);
        const dataValues = [];
        const backgroundColors = [];
        const borderColors = [];

        for (const key in idealRanges) {
            const featureValue = selectedRecordFeatures[key];
            const range = idealRanges[key];

            if (featureValue === null) {
                dataValues.push(0); // 或其他表示缺失值的方式
                backgroundColors.push('rgba(128, 128, 128, 0.4)'); // 灰色表示缺失
                borderColors.push('rgba(128, 128, 128, 1)');
                continue;
            }

            let normalizedValue;
            if (key === 'max_stride_length_px' || key === 'min_elbow_height_px' || key === 'avg_shoulder_width_px' || key === 'max_hand_speed_px_per_s') {
                // 對於「越大越好」的指標，直接按比例計算，但設上限
                normalizedValue = Math.min(featureValue, range.max) / range.max;
            } else {
                // 對於有最佳範圍的指標，計算其在範圍內的接近度
                const mid = (range.min + range.max) / 2;
                const max_dev = Math.max(mid - range.min, range.max - mid);
                normalizedValue = 1 - (Math.abs(featureValue - mid) / max_dev);
                normalizedValue = Math.max(0, normalizedValue); // 確保不小於0
            }
            dataValues.push(normalizedValue);

            // 根據正規化後的值給顏色
            if (normalizedValue >= 0.8) {
                backgroundColors.push('rgba(75, 192, 192, 0.6)'); // 綠色 - 很好
                borderColors.push('rgba(75, 192, 192, 1)');
            } else if (normalizedValue >= 0.5) {
                backgroundColors.push('rgba(255, 206, 86, 0.6)'); // 黃色 - 尚可
                borderColors.push('rgba(255, 206, 86, 1)');
            } else {
                backgroundColors.push('rgba(255, 99, 132, 0.6)'); // 紅色 - 需改善
                borderColors.push('rgba(255, 99, 132, 1)');
            }
        }

        this.charts.biomechanicsRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '選定紀錄的運動力學表現 (正規化)',
                    data: dataValues,
                    backgroundColor: 'rgba(153, 102, 255, 0.4)', // 統一填充色
                    borderColor: 'rgba(153, 102, 255, 1)', // 統一邊框色
                    pointBackgroundColor: backgroundColors, // 每個點的顏色
                    pointBorderColor: borderColors,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(153, 102, 255, 1)'
                }]
            },
            options: {
                responsive: true,
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
                                const featureName = Object.keys(idealRanges)[context.dataIndex];
                                const originalValue = selectedRecordFeatures[featureName];
                                return `${label} ${context.formattedValue} (原始值: ${originalValue !== null ? originalValue.toFixed(2) : 'N/A'})`;
                            }
                        }
                    }
                }
            }
        });
    }
};

export default ChartRenderer;