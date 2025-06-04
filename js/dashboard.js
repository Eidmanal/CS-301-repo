$(document).ready(function(){


let comboChart;

function initComboChart() {
  const ctx = document.getElementById('comboChart').getContext('2d');
  comboChart = new Chart(ctx, {
    data: {
      labels: [], // initially empty
      datasets: [
        {
          type: 'bar',
          label: 'Private purchases',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderRadius: 4,
          barThickness: 20
        },
        {
          type: 'line',
          label: 'Government purchases',
          data: [],
          borderColor: 'rgba(0, 200, 83, 1)',
          backgroundColor: 'rgba(0, 200, 83, 0.1)',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgba(0, 200, 83, 1)',
          pointRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      stacked: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Private purchases'
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'Government purchases'
          }
        }
      }
    }
  });
}

  function updateComboChart(labels, privateData, governmentData) {
    comboChart.data.labels = labels;
    comboChart.data.datasets[0].data = privateData;
    comboChart.data.datasets[1].data = governmentData;
    comboChart.update();
  }

  initComboChart();

    updateComboChart(
    ['01 Jan', '02 Jan', '03 Jan', '04 Jan'],
    [300, 400, 250, 500],
    [20, 25, 22, 30]
  );

  var ctx = document.getElementById('myPieChart').getContext('2d');
  var myPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Vacant', 'Occupied', 'Government owned'],
      datasets: [{
        data: [40, 50, 10],
        backgroundColor: ['rgb(98, 135, 245)', 'rgb(250, 33, 33)', 'rgb(255, 166, 43)']
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
 
   
  var ctx2 = document.getElementById('mySummarizedChart').getContext('2d');
  var mysummarizedChart = new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: ['Vacant', 'Occupied'],
      datasets: [{
        data: [40, 60],
        backgroundColor: ['rgb(98, 135, 245)', 'rgb(148, 148, 148)']
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });

  //End of ready()
});