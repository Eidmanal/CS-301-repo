$(document).ready(function(){


  var ctx = document.getElementById('comboChart').getContext('2d');
  var comboChart = new Chart(ctx, {
    data: {
      labels: ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan', '06 Jan', '07 Jan', '08 Jan', '09 Jan', '10 Jan', '11 Jan', '12 Jan'],
      datasets: [
        {
          type: 'bar',
          label: 'Private purchases',
          data: [300, 400, 500, 600, 200, 300, 250, 400, 550, 650, 300, 200],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderRadius: 4,
          barThickness: 20
        },
        {
          type: 'line',
          label: 'Government purchases',
          data: [20, 25, 30, 28, 35, 38, 40, 33, 29, 31, 25, 20],
          borderColor: 'rgba(0, 200, 83, 1)',
          backgroundColor: 'rgba(0, 200, 83, 0.1)',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'white',
          pointBorderColor: 'rgba(0, 200, 83, 1)',
          pointRadius: 5
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