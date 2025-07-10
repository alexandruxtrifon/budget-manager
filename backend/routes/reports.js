const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const authMiddleware = require('../authMiddleware');
const { logActivity } = require('../logActivity');
const { format } = require('date-fns');

module.exports = (pool) => {
  router.post('/analytics-pdf', authMiddleware, async (req, res) => {
    try {
        const { 
            chartData, 
            timeframe, 
            accountName, 
            currency, 
            startDate, 
            endDate,
            summary 
        } = req.body;
        
          let chartJsLib;
      try {
        const chartJsPath = path.join(__dirname, '../templates/chart.min.js');
        
        if (fs.existsSync(chartJsPath)) {
          chartJsLib = fs.readFileSync(chartJsPath, 'utf8');
          //console.log(`path chartjs ${chartJsLib}`)
        } else {
          const fetch = require('node-fetch');
          const response = await fetch('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js');
          chartJsLib = await response.text();
          fs.writeFileSync(chartJsPath, chartJsLib);
        }
      } catch (chartError) {
        console.error('Error obtaining Chart.js:', chartError);
        chartJsLib = '/* Chart.js could not be loaded */';
      }

      await logActivity(
        pool,
        req.user.user_id,
        'GENERATE_REPORT',
        'ANALYTICS',
        `${accountName} - ${timeframe} Report`,
        {
          timeframe,
          startDate,
          endDate,
          currency,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      const templatePath = path.join(__dirname, '../templates/analytics-report.html');
      const templateHtml = fs.readFileSync(templatePath, 'utf8');
      
      const template = handlebars.compile(templateHtml);
      const html = template({
        accountName,
        timeframe,
        currency,
        startDate,
        endDate,
        userName: req.user.email,
        summary,
        date: new Date().toLocaleDateString(),
        categoryData: JSON.stringify(chartData.categoryData || []),
        timelineData: JSON.stringify(chartData.timelineData || []),
        monthlyData: JSON.stringify(chartData.monthlyData || []),
        chartJsLib
      });
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      page.on('console', msg => console.log('Browser console:', msg.text()));
      page.on('pageerror', error => console.error('Page error:', error.message));
      
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });
      
      // styles and scripts needed for chart rendering
    //   await page.addStyleTag({ 
    //     url: 'https://cdn.jsdelivr.net/npm/recharts@3.0.2/umd/Recharts.min.css' 
    //   });
        await page.addScriptTag({ 
        url: 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js' 
        });
        //await page.waitForTimeout(1000);
          // Instead, add React and Recharts directly from CDN with timeout
    //   await page.addScriptTag({ 
    //     content: `
    //       if (!window.React) {
    //         window.React = { createElement: (type, props, ...children) => ({ type, props, children }) };
    //         window.ReactDOM = { render: () => {} };
    //         console.log("Using simplified React substitute for PDF generation");
    //       }
    //     `
    //   });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();
      
      res.contentType('application/pdf');
      res.send(pdf);
      
    //   await pool.query(
    //     `INSERT INTO activity_logs 
    //      (user_id, action, entity_type, entity_name) 
    //      VALUES ($1, $2, $3, $4)`,
    //     [req.user.user_id, 'generated_report', 'analytics', `${accountName} - ${timeframe} Report`]
    //   );
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
      console.log(error);
    }
  });

  // Add this new endpoint to your reports.js file

router.post('/spending-analysis', authMiddleware, async (req, res) => {
  try {
    const { user_id, account_id, start_date, end_date } = req.body;
    
    // Build query conditions based on parameters
    let accountCondition = '';
    let queryParams = [user_id, start_date, end_date];
    let paramIndex = 4;
    
    if (account_id && account_id !== 'all') {
      accountCondition = 'AND t.account_id = $4';
      queryParams.push(account_id);
      paramIndex++;
    }

    // Fetch transactions for the period
    const transactionsQuery = `
      SELECT 
        t.transaction_id, 
        t.description, 
        t.amount, 
        t.transaction_date, 
        t.transaction_type,
        t.account_id,
        a.name AS account_name,
        a.currency,
        c.name AS category_name,
        c.category_id
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.account_id
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1
        AND t.transaction_date BETWEEN $2 AND $3
        ${accountCondition}
      ORDER BY t.transaction_date ASC
    `;
    
    const transactionsResult = await pool.query(transactionsQuery, queryParams);
    const transactions = transactionsResult.rows;
    
    // Get previous period data for comparison
    const daysDiff = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(start_date).getTime() - daysDiff * 24 * 60 * 60 * 1000);
    const prevEndDate = new Date(new Date(start_date).getTime() - 1);
    
    const prevTransactionsQuery = `
      SELECT 
        t.amount, 
        t.transaction_date, 
        t.transaction_type
      FROM transactions t
      WHERE t.user_id = $1
        AND t.transaction_date BETWEEN $2 AND $3
        ${accountCondition}
    `;
    
    const prevQueryParams = [
      user_id, 
      format(prevStartDate, 'yyyy-MM-dd'), 
      format(prevEndDate, 'yyyy-MM-dd')
    ];
    
    if (account_id && account_id !== 'all') {
      prevQueryParams.push(account_id);
    }
    
    const prevTransactionsResult = await pool.query(prevTransactionsQuery, prevQueryParams);
    const prevTransactions = prevTransactionsResult.rows;
    
    // Filter expenses and income
    const expenses = transactions.filter(t => t.transaction_type === 'expense');
    const income = transactions.filter(t => t.transaction_type === 'income');
    const prevExpenses = prevTransactions.filter(t => t.transaction_type === 'expense');
    
    // Calculate total amounts
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const prevTotalExpenses = prevExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Calculate expense trend compared to previous period
    const expenseTrend = prevTotalExpenses === 0 ? 0 : 
      Math.round((totalExpenses - prevTotalExpenses) / prevTotalExpenses * 100);
    
    // Calculate average daily spending
    const avgDailySpend = daysDiff > 0 ? totalExpenses / daysDiff : totalExpenses;
    
    // Get largest transaction
    const largestTransaction = expenses.length > 0 ? 
      expenses.reduce((max, t) => parseFloat(t.amount) > parseFloat(max.amount) ? t : max, expenses[0]) : 
      null;
    
    // Category breakdown analysis
    const categorySums = {};
    expenses.forEach(t => {
      const categoryName = t.category_name || 'Uncategorized';
      categorySums[categoryName] = (categorySums[categoryName] || 0) + parseFloat(t.amount);
    });
    
    const categoryBreakdown = Object.entries(categorySums).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
    
    // Find top spending category
    const topCategory = categoryBreakdown.length > 0 ? {
      name: categoryBreakdown[0].name,
      amount: categoryBreakdown[0].value,
      percentage: Math.round((categoryBreakdown[0].value / totalExpenses) * 100)
    } : null;
    
    // Generate timeline data
    const dailyData = {};
    transactions.forEach(t => {
      // Format the date regardless of whether it's a string or Date object
      const day = t.transaction_date instanceof Date 
        ? format(t.transaction_date, 'yyyy-MM-dd')
        : typeof t.transaction_date === 'string' 
          ? t.transaction_date.split('T')[0]
          : format(new Date(t.transaction_date), 'yyyy-MM-dd');
          
      if (!dailyData[day]) {
        dailyData[day] = { date: day, income: 0, expense: 0 };
      }
      
      if (t.transaction_type === 'income') {
        dailyData[day].income += parseFloat(t.amount);
      } else if (t.transaction_type === 'expense') {
        dailyData[day].expense += parseFloat(t.amount);
      }
    });
    
    const timelineData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    
    // Weekday spending analysis
    const weekdaySpending = [
      { day: 'Sunday', amount: 0 },
      { day: 'Monday', amount: 0 },
      { day: 'Tuesday', amount: 0 },
      { day: 'Wednesday', amount: 0 },
      { day: 'Thursday', amount: 0 },
      { day: 'Friday', amount: 0 },
      { day: 'Saturday', amount: 0 }
    ];
    
    expenses.forEach(t => {
      const date = new Date(t.transaction_date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      weekdaySpending[dayOfWeek].amount += parseFloat(t.amount);
    });
    
    // Merchant frequency analysis
    const merchants = {};
    expenses.forEach(t => {
      const merchant = t.description;
      if (!merchants[merchant]) {
        merchants[merchant] = { count: 0, total: 0 };
      }
      merchants[merchant].count += 1;
      merchants[merchant].total += parseFloat(t.amount);
    });
    
    const merchantFrequency = Object.entries(merchants)
      .map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 merchants
    
    // Monthly spending trends
    const monthlyData = {};
    transactions.forEach(t => {
      if (t.transaction_type !== 'expense') return;
      
      const date = new Date(t.transaction_date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = { period: month, amount: 0, count: 0 };
      }
      
      monthlyData[month].amount += parseFloat(t.amount);
      monthlyData[month].count += 1;
    });
    
    Object.values(monthlyData).forEach(month => {
      month.average = month.count > 0 ? month.amount / month.count : 0;
    });
    
    const spendingTrends = Object.values(monthlyData)
      .sort((a, b) => a.period.localeCompare(b.period));
    
    // Anomaly detection
    const anomalies = [];
    
    // Detect unusually large transactions (2x the average transaction amount)
    const avgTransactionAmount = expenses.length > 0 ?
      expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0) / expenses.length : 0;
    
    expenses.forEach(t => {
      const amount = parseFloat(t.amount);
      if (amount > avgTransactionAmount * 2) {
        anomalies.push({
          type: 'Large Transaction',
          date: format(new Date(t.transaction_date), 'MMM dd, yyyy'),
          description: t.description,
          amount,
          percentDiff: Math.round((amount - avgTransactionAmount) / avgTransactionAmount * 100),
          comparedTo: 'higher than your average transaction'
        });
      }
    });
    
    // Detect category spending spikes
    const categoryCounts = {};
    const categoryAvgs = {};
    
    expenses.forEach(t => {
      const categoryName = t.category_name || 'Uncategorized';
      if (!categoryCounts[categoryName]) {
        categoryCounts[categoryName] = 0;
        categoryAvgs[categoryName] = 0;
      }
      categoryCounts[categoryName]++;
      categoryAvgs[categoryName] += parseFloat(t.amount);
    });
    
    Object.keys(categoryAvgs).forEach(cat => {
      categoryAvgs[cat] = categoryAvgs[cat] / categoryCounts[cat];
    });
    
    expenses.forEach(t => {
      const categoryName = t.category_name || 'Uncategorized';
      const amount = parseFloat(t.amount);
      const avg = categoryAvgs[categoryName];
      
      if (amount > avg * 3 && amount > 100) { // 3x category average and at least $100
        anomalies.push({
          type: 'Category Anomaly',
          date: format(new Date(t.transaction_date), 'MMM dd, yyyy'),
          description: `Unusual ${categoryName} expense: ${t.description}`,
          amount,
          percentDiff: Math.round((amount - avg) / avg * 100),
          comparedTo: `higher than your average ${categoryName} transaction`
        });
      }
    });
    
    await logActivity(
      pool, 
      req.user.user_id, 
      'VIEW_SPENDING_ANALYSIS', 
      'REPORT', 
      null,
      {
        user_id,
        account_id,
        start_date,
        end_date,
        transaction_count: transactions.length,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    res.json({
      summary: {
        totalExpenses,
        totalIncome,
        netBalance: totalIncome - totalExpenses,
        avgDailySpend,
        expenseTrend,
        transactionCount: transactions.length,
        topCategory,
        largestTransaction: largestTransaction ? {
          amount: parseFloat(largestTransaction.amount),
          description: largestTransaction.description
        } : null
      },
      categoryBreakdown,
      timelineData,
      weekdayAnalysis: weekdaySpending,
      merchantFrequency,
      spendingTrends,
      anomalies
    });
  } catch (error) {
    console.error('Error analyzing spending:', error);
    res.status(500).json({ error: 'Failed to analyze spending behavior' });
  }
});

router.post('/spending-progression', authMiddleware, async (req, res) => {
  try {
    const { user_id, account_id, start_date, end_date } = req.body;
    
    // Build query conditions based on parameters
    let accountCondition = '';
    let queryParams = [user_id];
    let paramIndex = 2;
    
    if (account_id && account_id !== 'all') {
      accountCondition = 'AND t.account_id = $' + paramIndex;
      queryParams.push(account_id);
      paramIndex++;
    }

    // Get transactions for the last 3 months to analyze patterns
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const transactionsQuery = `
      SELECT 
        t.transaction_id, 
        t.description, 
        t.amount, 
        t.transaction_date, 
        t.transaction_type,
        EXTRACT(DAY FROM t.transaction_date) as day_of_month,
        EXTRACT(MONTH FROM t.transaction_date) as month,
        EXTRACT(YEAR FROM t.transaction_date) as year
      FROM transactions t
      WHERE t.user_id = $1
        AND t.transaction_date >= $${paramIndex}
        ${accountCondition}
        AND t.transaction_type = 'expense'
      ORDER BY t.transaction_date ASC
    `;
    
    queryParams.push(format(threeMonthsAgo, 'yyyy-MM-dd'));
    
    const transactionsResult = await pool.query(transactionsQuery, queryParams);
    const transactions = transactionsResult.rows;
    
    // Get income transactions (paydays)
    const incomeQuery = `
      SELECT 
        t.transaction_id, 
        t.amount, 
        t.transaction_date
      FROM transactions t
      WHERE t.user_id = $1
        AND t.transaction_date >= $${paramIndex}
        ${accountCondition}
        AND t.transaction_type = 'income'
        AND t.amount > 0
      ORDER BY t.transaction_date ASC
    `;
    
    const incomeResult = await pool.query(incomeQuery, queryParams);
    const incomeTransactions = incomeResult.rows;
    
    // 1. Calculate Cumulative Spending Curve
    const monthlySpending = {};
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Group transactions by month and day
    transactions.forEach(t => {
      const monthKey = `${t.year}-${t.month}`;
      const day = parseInt(t.day_of_month);
      
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = Array(31).fill(0);
      }
      
      monthlySpending[monthKey][day-1] += parseFloat(t.amount);
    });
    
    // Calculate cumulative spending for each month
    const cumulativeByMonth = {};
    Object.keys(monthlySpending).forEach(month => {
      cumulativeByMonth[month] = [];
      let cumulative = 0;
      
      for (let day = 0; day < 31; day++) {
        cumulative += monthlySpending[month][day];
        cumulativeByMonth[month].push({
          day: day + 1,
          amount: cumulative
        });
      }
    });
    
    // Get current month's data
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    let currentMonthData = cumulativeByMonth[currentMonthKey] || [];
    
    console.log('Available month keys:', Object.keys(cumulativeByMonth));
console.log('Current month key:', currentMonthKey);
console.log('Current month data length:', currentMonthData.length);
if (currentMonthData.length === 0) {
  const monthKeys = Object.keys(cumulativeByMonth).sort();
  if (monthKeys.length > 0) {
    const mostRecentMonthKey = monthKeys[monthKeys.length - 1];
    console.log('Using most recent month instead:', mostRecentMonthKey);
    currentMonthData = cumulativeByMonth[mostRecentMonthKey] || [];
  }
}
if (currentMonthData.length === 0) {
  console.log('Creating placeholder data for display');
  // Calculate total spending from all transactions
  const totalSpending = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  // Create a placeholder even distribution
  currentMonthData = Array(31).fill(0).map((_, idx) => ({
    day: idx + 1,
    amount: (totalSpending / 31) * (idx + 1)
  }));
}
    // Calculate average pattern across all months
    const averagePattern = [];
    const monthCount = Object.keys(cumulativeByMonth).length;
    
    if (monthCount > 0) {
      // Initialize with 31 days
      for (let day = 0; day < 31; day++) {
        let totalForDay = 0;
        let monthsWithData = 0;
        
        Object.keys(cumulativeByMonth).forEach(month => {
          if (cumulativeByMonth[month][day] && cumulativeByMonth[month][day].amount) {
            // Normalize to percentage of month total
            const monthTotal = cumulativeByMonth[month][30] ? cumulativeByMonth[month][30].amount : 0;
            if (monthTotal > 0) {
              totalForDay += (cumulativeByMonth[month][day].amount / monthTotal);
              monthsWithData++;
            }
          }
        });
        
        const avgPercentage = monthsWithData > 0 ? totalForDay / monthsWithData : 0;
        averagePattern.push({
          day: day + 1,
          percentage: avgPercentage
        });
      }
    }
    
    // Create the ideal linear pattern (spending evenly throughout month)
    const idealPattern = [];
    for (let day = 1; day <= 31; day++) {
      idealPattern.push({
        day,
        percentage: day / 31
      });
    }
    
    // Combine into final cumulative spending dataset
    const cumulativeSpending = [];
    const currentMonthTotal = currentMonthData.length > 0 && currentMonthData[currentMonthData.length - 1] 
      ? currentMonthData[currentMonthData.length - 1].amount : 0;
    
    for (let day = 1; day <= 31; day++) {
      const current = (currentMonthData[day-1]?.amount || 0);
      const avg = averagePattern[day-1]?.percentage * currentMonthTotal;
      const ideal = idealPattern[day-1]?.percentage * currentMonthTotal;
      
      cumulativeSpending.push({
        day,
        current,
        average: avg,
        ideal
      });
    }
    
    // Determine spending style
    let spendingStyle = { type: "Balanced", description: "You tend to spend evenly throughout the month." };
    
    // Compare first half spending vs second half
    const firstHalfSpending = currentMonthData.slice(0, 14).reduce((sum, day) => sum + day.amount, 0);
    const secondHalfSpending = currentMonthData.slice(15, 30).reduce((sum, day) => sum + day.amount, 0);
    const totalSpending = firstHalfSpending + secondHalfSpending;
    
    if (totalSpending > 0) {
      const firstHalfPercentage = (firstHalfSpending / totalSpending) * 100;
      
      if (firstHalfPercentage > 65) {
        spendingStyle = {
          type: "Front-Loader",
          description: "You tend to spend heavily in the first half of the month, with spending trailing off later."
        };
      } else if (firstHalfPercentage < 35) {
        spendingStyle = {
          type: "Back-Loader",
          description: "You tend to conserve spending early in the month and spend more heavily toward month-end."
        };
      }
    }
    
    // 2. Calculate Daily Spending Velocity by Week
    const weeklyData = [
      { week: "Week 1 (1-7)", totalSpent: 0, daysCount: 0 },
      { week: "Week 2 (8-14)", totalSpent: 0, daysCount: 0 },
      { week: "Week 3 (15-21)", totalSpent: 0, daysCount: 0 },
      { week: "Week 4+ (22-31)", totalSpent: 0, daysCount: 0 }
    ];
    
    // Group all transactions by week of month
    transactions.forEach(t => {
      const day = parseInt(t.day_of_month);
      const amount = parseFloat(t.amount);
      
      if (day >= 1 && day <= 7) {
        weeklyData[0].totalSpent += amount;
        weeklyData[0].daysCount++;
      } else if (day >= 8 && day <= 14) {
        weeklyData[1].totalSpent += amount;
        weeklyData[1].daysCount++;
      } else if (day >= 15 && day <= 21) {
        weeklyData[2].totalSpent += amount;
        weeklyData[2].daysCount++;
      } else if (day >= 22 && day <= 31) {
        weeklyData[3].totalSpent += amount;
        weeklyData[3].daysCount++;
      }
    });
    
    // Calculate average daily spending for each week
    const weeklyVelocity = weeklyData.map(week => ({
      week: week.week,
      totalSpent: week.totalSpent,
      averageDaily: week.daysCount > 0 ? week.totalSpent / week.daysCount : 0
    }));
    
    // Find highest and lowest spending weeks
    const nonZeroWeeks = weeklyVelocity.filter(w => w.averageDaily > 0);
    const highestWeek = nonZeroWeeks.length > 0 
      ? nonZeroWeeks.reduce((prev, current) => 
          (prev.averageDaily > current.averageDaily) ? prev : current) 
      : null;
    
    const lowestWeek = nonZeroWeeks.length > 0 
      ? nonZeroWeeks.reduce((prev, current) => 
          (prev.averageDaily < current.averageDaily) ? prev : current) 
      : null;
    
    // Calculate week-to-week variance
    let weeklyVariance = 0;
    if (highestWeek && lowestWeek && lowestWeek.averageDaily > 0) {
      weeklyVariance = Math.round(
        ((highestWeek.averageDaily - lowestWeek.averageDaily) / lowestWeek.averageDaily) * 100
      );
    }
    
    // 3. Payday Impact Analysis
    // Create an array with days relative to payday (-15 to +15)
    const daysAroundPayday = Array.from({ length: 31 }, (_, i) => ({
      day: i - 15,
      spending: 0,
      count: 0
    }));
    
    // For each income transaction (payday)
    incomeTransactions.forEach(income => {
      const paydayDate = new Date(income.transaction_date);
      
      // Look at each expense transaction
      transactions.forEach(expense => {
        const expenseDate = new Date(expense.transaction_date);
        
        // Calculate days from this payday
        const daysDiff = Math.round((expenseDate - paydayDate) / (1000 * 60 * 60 * 24));
        
        // If within our window of -15 to +15 days
        if (daysDiff >= -15 && daysDiff <= 15) {
          const index = daysDiff + 15; // Convert to 0-based index
          daysAroundPayday[index].spending += parseFloat(expense.amount);
          daysAroundPayday[index].count++;
        }
      });
    });
    
    // Calculate average daily spending around paydays
    const paydayImpact = daysAroundPayday.map(day => ({
      day: day.day,
      spending: day.count > 0 ? day.spending / day.count : 0
    }));
    
    // Calculate pre-payday and post-payday averages
    const prePaydayDays = paydayImpact.filter(d => d.day >= -5 && d.day < 0);
    const postPaydayDays = paydayImpact.filter(d => d.day > 0 && d.day <= 5);
    
    const prePaydayAvg = prePaydayDays.length > 0 
      ? prePaydayDays.reduce((sum, day) => sum + day.spending, 0) / prePaydayDays.length 
      : 0;
      
    const postPaydayAvg = postPaydayDays.length > 0 
      ? postPaydayDays.reduce((sum, day) => sum + day.spending, 0) / postPaydayDays.length 
      : 0;
    
    const paydaySummary = {
      prePayday: prePaydayAvg,
      postPayday: postPaydayAvg,
      changePercentage: prePaydayAvg > 0 
        ? Math.round(((postPaydayAvg - prePaydayAvg) / prePaydayAvg) * 100) 
        : 0
    };
    
    await logActivity(
      pool, 
      req.user.user_id, 
      'VIEW_SPENDING_PROGRESSION', 
      'REPORT', 
      'Monthly Spending Progression Analysis',
      {
        user_id,
        account_id,
        transaction_count: transactions.length,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    res.json({
      cumulativeSpending,
      spendingStyle,
      weeklyVelocity,
      highestWeek,
      lowestWeek,
      weeklyVariance,
      paydayImpact,
      paydaySummary
    });
  } catch (error) {
    console.error('Error analyzing spending progression:', error);
    res.status(500).json({ error: 'Failed to analyze spending progression' });
  }
});


  return router;
};