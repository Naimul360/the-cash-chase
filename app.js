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

let incomeChart, hoursChart, deliveriesChart;

document.getElementById("entryDate").valueAsDate = new Date();

window.saveEntry = async function () {
  const name = document.getElementById("name").value;
  const platform = document.getElementById("platform").value;
  const income = Number(document.getElementById("income").value);
  const hours = Number(document.getElementById("hours").value);
  const deliveries = Number(document.getElementById("deliveries").value);
  const dateValue = document.getElementById("entryDate").value;

  if (!dateValue) {
    alert("Please select a date.");
    return;
  }

  if (!income && !hours && !deliveries) {
    alert("Please enter income, hours, or deliveries.");
    return;
  }

  const selectedDate = new Date(dateValue + "T00:00:00");
  const dayName = selectedDate.toLocaleDateString("en-AU", { weekday: "long" });
  const dateText = selectedDate.toLocaleDateString("en-AU");

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
  updateSummary(totals);
  updateLeaderboard(totals);
  updateCharts(totals);
  updateDailyChampion(entries);
  updateWeeklyWinners(entries);
  updateOvertakeMeter(totals);
  updatePlatformBreakdown(entries);
  updateCountdown();
});

function calculateTotals(entries) {
  const totals = {};
  players.forEach(p => totals[p] = { income: 0, hours: 0, deliveries: 0 });

  entries.forEach(e => {
    if (!totals[e.name]) return;
    totals[e.name].income += Number(e.income || 0);
    totals[e.name].hours += Number(e.hours || 0);
    totals[e.name].deliveries += Number(e.deliveries || 0);
  });

  return totals;
}

function updateTable(entries) {
  const table = document.getElementById("entriesTable");
  table.innerHTML = "";

  entries.forEach(e => {
    table.innerHTML += `
      <tr>
        <td>${e.date || "-"}</td>
        <td>${e.day || "-"}</td>
        <td>${e.name}</td>
        <td>${e.platform}</td>
        <td>$${Number(e.income || 0).toFixed(2)}</td>
        <td>${Number(e.hours || 0).toFixed(1)}</td>
        <td>${Number(e.deliveries || 0)}</td>
      </tr>
    `;
  });
}

function updateSummary(totals) {
  const totalIncome = players.reduce((s, p) => s + totals[p].income, 0);
  const totalHours = players.reduce((s, p) => s + totals[p].hours, 0);
  const totalDeliveries = players.reduce((s, p) => s + totals[p].deliveries, 0);
  const hourly = totalHours > 0 ? totalIncome / totalHours : 0;

  document.getElementById("teamIncome").innerText = `$${totalIncome.toFixed(2)}`;
  document.getElementById("teamHours").innerText = `${totalHours.toFixed(1)} hrs`;
  document.getElementById("teamDeliveries").innerText = totalDeliveries;
  document.getElementById("teamHourly").innerText = `$${hourly.toFixed(2)}/hr`;
}

function getRanking(totals) {
  return players.map(name => ({
    name,
    income: totals[name].income,
    hours: totals[name].hours,
    deliveries: totals[name].deliveries,
    hourly: totals[name].hours > 0 ? totals[name].income / totals[name].hours : 0
  })).sort((a, b) => b.income - a.income);
}

function updateLeaderboard(totals) {
  const ranking = getRanking(totals);
  const leaderboard = document.getElementById("leaderboard");
  leaderboard.innerHTML = "";

  ranking.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";

    leaderboard.innerHTML += `
      <p>
        ${medal} <strong>${p.name}</strong><br>
        💰 $${p.income.toFixed(2)} |
        ⏱ ${p.hours.toFixed(1)} hrs |
        📦 ${p.deliveries} |
        ⚡ $${p.hourly.toFixed(2)}/hr
      </p>
      <hr>
    `;
  });

  const loser = ranking[ranking.length - 1];
  document.getElementById("loser").innerText =
    `🍔 ${loser.name} is currently the dinner sponsor.`;

  const leader = ranking[0];
  const second = ranking[1];
  const last = ranking[2];

  document.getElementById("gapAlert").innerText =
    `🚨 ${second.name} is $${(leader.income - second.income).toFixed(2)} behind ${leader.name}. ${last.name} needs $${(second.income - last.income).toFixed(2)} to overtake ${second.name}.`;
}

function updateCharts(totals) {
  const labels = players;
  const incomeData = players.map(p => totals[p].income);
  const hoursData = players.map(p => totals[p].hours);
  const deliveriesData = players.map(p => totals[p].deliveries);

  incomeChart = drawChart("incomeChart", incomeChart, "Income ($)", labels, incomeData);
  hoursChart = drawChart("hoursChart", hoursChart, "Hours", labels, hoursData);
  deliveriesChart = drawChart("deliveriesChart", deliveriesChart, "Deliveries", labels, deliveriesData);
}

function drawChart(id, oldChart, label, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return oldChart;

  if (oldChart) oldChart.destroy();

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderWidth: 1
      }]
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
}

function updateDailyChampion(entries) {
  const today = new Date().toLocaleDateString("en-AU");
  const dailyTotals = {};
  players.forEach(p => dailyTotals[p] = 0);

  entries.forEach(e => {
    if (e.date === today && dailyTotals[e.name] !== undefined) {
      dailyTotals[e.name] += Number(e.income || 0);
    }
  });

  const ranking = players
    .map(name => ({ name, income: dailyTotals[name] }))
    .sort((a, b) => b.income - a.income);

  const champion = ranking[0];

  if (champion.income === 0) {
    document.getElementById("dailyChampion").innerText =
      "No one has entered income today yet.";
  } else {
    document.getElementById("dailyChampion").innerText =
      `👑 ${champion.name} is today's champion with $${champion.income.toFixed(2)}.`;
  }
}

function updateOvertakeMeter(totals) {
  const ranking = getRanking(totals);
  const leaderIncome = ranking[0].income || 1;
  const box = document.getElementById("overtakeMeter");

  box.innerHTML = "";

  ranking.forEach((p, index) => {
    const percent = Math.min((p.income / leaderIncome) * 100, 100);
    const target = index === 0 ? 0 : ranking[index - 1].income - p.income;

    box.innerHTML += `
      <div class="progress-box">
        <strong>${index + 1}. ${p.name}</strong> — $${p.income.toFixed(2)}
        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <small>${index === 0 ? "Currently leading 🏆" : `Needs $${target.toFixed(2)} to overtake ${ranking[index - 1].name}`}</small>
      </div>
    `;
  });
}

function updatePlatformBreakdown(entries) {
  const platforms = ["Uber Eats", "DoorDash", "Cash Job"];
  const data = {};

  players.forEach(player => {
    data[player] = {};
    platforms.forEach(platform => data[player][platform] = 0);
  });

  entries.forEach(e => {
    if (data[e.name] && data[e.name][e.platform] !== undefined) {
      data[e.name][e.platform] += Number(e.income || 0);
    }
  });

  const box = document.getElementById("platformBreakdown");
  box.innerHTML = `<div class="breakdown-grid"></div>`;

  const grid = box.querySelector(".breakdown-grid");

  players.forEach(player => {
    grid.innerHTML += `
      <div class="breakdown-card">
        <h3>${player}</h3>
        <p>🛵 Uber Eats: $${data[player]["Uber Eats"].toFixed(2)}</p>
        <p>🚗 DoorDash: $${data[player]["DoorDash"].toFixed(2)}</p>
        <p>💵 Cash Job: $${data[player]["Cash Job"].toFixed(2)}</p>
      </div>
    `;
  });
}

function updateWeeklyWinners(entries) {
  const box = document.getElementById("weeklyWinners");

  if (!box) return;

  const weeklyData = {};

  entries.forEach(entry => {
    if (!entry.date) return;

    const parts = entry.date.split("/");
    const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);

    const week = Math.ceil(dateObj.getDate() / 7);

    if (!weeklyData[week]) {
      weeklyData[week] = {};
      players.forEach(player => {
        weeklyData[week][player] = 0;
      });
    }

    weeklyData[week][entry.name] += Number(entry.income || 0);
  });

  box.innerHTML = "";

  Object.keys(weeklyData)
    .sort((a, b) => a - b)
    .forEach(week => {

      const winner = Object.entries(weeklyData[week])
        .sort((a, b) => b[1] - a[1])[0];

      box.innerHTML += `
        <div style="margin-bottom:15px;">
          <strong>📅 Week ${week}</strong><br>
          🥇 ${winner[0]} - $${winner[1].toFixed(2)}
        </div>
      `;
    });

  if (box.innerHTML === "") {
    box.innerHTML = "No weekly data yet.";
  }
}

function updateCountdown() {
  const endDate = new Date("2026-07-26T23:59:59");
  const diff = endDate - new Date();
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  document.getElementById("countdown").innerText =
    `${daysLeft} days remaining until 26 July 2026`;
}
