import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZmp_2k1y7m-Y3J9nB7o7gbzMsRPB9GY0",
  authDomain: "the-cash-chase-2026.firebaseapp.com",
  projectId: "the-cash-chase-2026",
  storageBucket: "the-cash-chase-2026.firebasestorage.app",
  messagingSenderId: "950424018422",
  appId: "1:950424018422:web:26a4951c875e56891c7bd7",
  measurementId: "G-PVFD629028"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const players = ["Naimul", "Ariyan", "Tahsin"];
const entriesRef = collection(db, "entries");

let incomeChart;
let hoursChart;
let deliveriesChart;

window.saveEntry = async function () {
  const name = document.getElementById("name").value;
  const platform = document.getElementById("platform").value;
  const income = Number(document.getElementById("income").value);
  const hours = Number(document.getElementById("hours").value);
  const deliveries = Number(document.getElementById("deliveries").value);

  if (!income && !hours && !deliveries) {
    alert("Please enter income, hours, or deliveries.");
    return;
  }

  const today = new Date();
  const dayName = today.toLocaleDateString("en-AU", { weekday: "long" });
  const dateText = today.toLocaleDateString("en-AU");

  await addDoc(entriesRef, {
    name,
    platform,
    income,
    hours,
    deliveries,
    date: dateText,
    day: dayName,
    createdAt: serverTimestamp()
  });

  document.getElementById("income").value = "";
  document.getElementById("hours").value = "";
  document.getElementById("deliveries").value = "";

  alert("Entry saved!");
};

const q = query(entriesRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const entries = [];
  snapshot.forEach((doc) => entries.push(doc.data()));

  const totals = calculateTotals(entries);

  updateTable(entries);
  updateLeaderboard(totals);
  updateSummary(totals);
  updateCharts(totals);
  updateCountdown();
});

function calculateTotals(entries) {
  const totals = {};

  players.forEach((player) => {
    totals[player] = {
      income: 0,
      hours: 0,
      deliveries: 0
    };
  });

  entries.forEach((entry) => {
    if (!totals[entry.name]) return;

    totals[entry.name].income += Number(entry.income || 0);
    totals[entry.name].hours += Number(entry.hours || 0);
    totals[entry.name].deliveries += Number(entry.deliveries || 0);
  });

  return totals;
}

function updateTable(entries) {
  const table = document.getElementById("entriesTable");
  table.innerHTML = "";

  entries.forEach((entry) => {
    table.innerHTML += `
      <tr>
        <td>${entry.name}</td>
        <td>${entry.platform}</td>
        <td>$${Number(entry.income || 0).toFixed(2)}</td>
        <td>${Number(entry.hours || 0).toFixed(1)}</td>
        <td>${Number(entry.deliveries || 0)}</td>
      </tr>
    `;
  });
}

function getRanking(totals) {
  return players
    .map((name) => {
      const income = totals[name].income;
      const hours = totals[name].hours;
      const deliveries = totals[name].deliveries;

      return {
        name,
        income,
        hours,
        deliveries,
        hourly: hours > 0 ? income / hours : 0
      };
    })
    .sort((a, b) => b.income - a.income);
}

function updateLeaderboard(totals) {
  const ranking = getRanking(totals);
  const leaderboard = document.getElementById("leaderboard");
  leaderboard.innerHTML = "";

  ranking.forEach((player, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

    leaderboard.innerHTML += `
      <p>
        ${medal} <strong>${player.name}</strong><br>
        💰 $${player.income.toFixed(2)} |
        ⏱ ${player.hours.toFixed(1)} hrs |
        📦 ${player.deliveries} deliveries |
        ⚡ $${player.hourly.toFixed(2)}/hr
      </p>
      <hr>
    `;
  });

  const loser = ranking[ranking.length - 1];
  document.getElementById("loser").innerHTML =
    `🍔 ${loser.name} is currently the dinner sponsor.`;
}

function updateSummary(totals) {
  const totalIncome = players.reduce((sum, p) => sum + totals[p].income, 0);
  const totalHours = players.reduce((sum, p) => sum + totals[p].hours, 0);
  const totalDeliveries = players.reduce((sum, p) => sum + totals[p].deliveries, 0);
  const teamHourly = totalHours > 0 ? totalIncome / totalHours : 0;

  document.getElementById("teamIncome").innerText = `$${totalIncome.toFixed(2)}`;
  document.getElementById("teamHours").innerText = `${totalHours.toFixed(1)} hrs`;
  document.getElementById("teamDeliveries").innerText = totalDeliveries;
  document.getElementById("teamHourly").innerText = `$${teamHourly.toFixed(2)}/hr`;
}

function updateCharts(totals) {
  const labels = players;
  const incomeData = players.map((p) => totals[p].income);
  const hoursData = players.map((p) => totals[p].hours);
  const deliveriesData = players.map((p) => totals[p].deliveries);

  drawChart("incomeChart", incomeChart, "Income ($)", incomeData, labels, (chart) => {
    incomeChart = chart;
  });

  drawChart("hoursChart", hoursChart, "Hours Worked", hoursData, labels, (chart) => {
    hoursChart = chart;
  });

  drawChart("deliveriesChart", deliveriesChart, "Deliveries", deliveriesData, labels, (chart) => {
    deliveriesChart = chart;
  });
}

function drawChart(canvasId, oldChart, label, data, labels, setChart) {
  const canvas = document.getElementById(canvasId);

  if (!canvas) return;

  if (oldChart) {
    oldChart.destroy();
  }

  const newChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  setChart(newChart);
}

function updateCountdown() {
  const endDate = new Date("2026-07-26T23:59:59");
  const today = new Date();
  const diff = endDate - today;
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  document.getElementById("countdown").innerHTML =
    `${daysLeft} days remaining until 26 July 2026`;
}
