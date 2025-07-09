const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const { logActivity } = require('../logActivity');

module.exports = (pool) => {
  // Get forecast data for a user
  router.get('/:userId', authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;
      const { startDate, endDate } = req.query;

      // Validate user access
      if (req.user.user_id != userId) {
        return res.status(403).json({ error: 'You can only access your own forecast data' });
      }

      // Default to last 6 months if no dates provided
      const start = startDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      // Get transaction data
      const transactionsResult = await pool.query(
        `SELECT 
          transaction_id, amount, transaction_type, transaction_date, currency
         FROM transactions
         WHERE user_id = $1
           AND transaction_date BETWEEN $2 AND $3
         ORDER BY transaction_date ASC`,
        [userId, start, end]
      );

      const transactions = transactionsResult.rows;
      // Calculate statistics for income
      const incomeTransactions = transactions.filter(t => t.transaction_type === 'income');
      const incomeAmounts = incomeTransactions.map(t => parseFloat(t.amount));
      
      // Calculate statistics for expenses
      const expenseTransactions = transactions.filter(t => t.transaction_type === 'expense');
      const expenseAmounts = expenseTransactions.map(t => parseFloat(t.amount));

      // Function to calculate median
      const calculateMedian = (numbers) => {
        if (!numbers.length) return 0;
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[middle - 1] + sorted[middle]) / 2
          : sorted[middle];
      };

      // Function to calculate mode
      const calculateMode = (numbers) => {
        if (!numbers.length) return 0;
        
        const frequency = {};
        numbers.forEach(num => {
          frequency[num] = (frequency[num] || 0) + 1;
        });
        
        let maxFreq = 0;
        let mode = 0;
        
        for (const [num, freq] of Object.entries(frequency)) {
          if (freq > maxFreq) {
            maxFreq = freq;
            mode = parseFloat(num);
          }
        }
        
        return mode;
      };

      // Generate monthly data for chart
      const generateMonthlyData = (transactions) => {
        const monthlyData = {};
        
        transactions.forEach(transaction => {
          const date = new Date(transaction.transaction_date);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          
          monthlyData[monthKey] += parseFloat(transaction.amount);
        });
        
        // Convert to array format for chart
        return Object.entries(monthlyData)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month));
      };
      const generateDailyData = (transactions) => {
        const dailyData = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.transaction_date);
            // Format as YYYY-MM-DD
            const dayKey = date.toISOString().split('T')[0];
            
            if (!dailyData[dayKey]) {
            dailyData[dayKey] = 0;
            }
            
            dailyData[dayKey] += parseFloat(transaction.amount);
        });
        
        // Convert to array format for chart
        return Object.entries(dailyData)
            .map(([day, amount]) => ({ day, amount }))
            .sort((a, b) => a.day.localeCompare(b.day));
        };

      // Generate simple forecast for the next 3 months
    //   const generateForecast = (monthlyData, months = 3) => {
    //     if (monthlyData.length < 2) return [];
        
    //     // Use last 6 months if available for trend calculation
    //     const recentMonths = monthlyData.slice(-6);
        
    //     // Simple linear regression for forecasting
    //     let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    //     const n = recentMonths.length;
        
    //     recentMonths.forEach((point, index) => {
    //       sumX += index;
    //       sumY += point.amount;
    //       sumXY += index * point.amount;
    //       sumX2 += index * index;
    //     });
        
    //     const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    //     const intercept = (sumY - slope * sumX) / n;
        
    //     // Generate forecast points
    //     const lastMonth = new Date(monthlyData[monthlyData.length - 1].month + '-01');
    //     const forecast = [];
        
    //     for (let i = 1; i <= months; i++) {
    //       const forecastMonth = new Date(lastMonth);
    //       forecastMonth.setMonth(lastMonth.getMonth() + i);
    //       const monthKey = `${forecastMonth.getFullYear()}-${(forecastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
          
    //       const forecastValue = intercept + slope * (n + i - 1);
    //       forecast.push({
    //         month: monthKey,
    //         amount: Math.max(0, forecastValue) // Prevent negative forecasts
    //       });
    //     }
        
    //     return forecast;
    //   };
const generateForecast = (dailyData, days = 30) => {
  if (dailyData.length < 5) return []; // Need more data points for reliable forecast
  
  // Use last 30 days if available for trend calculation
  const recentDays = dailyData.slice(-30);
  
  // Simple linear regression for forecasting
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = recentDays.length;
  
  recentDays.forEach((point, index) => {
    sumX += index;
    sumY += point.amount;
    sumXY += index * point.amount;
    sumX2 += index * index;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate forecast points
  const lastDay = new Date(dailyData[dailyData.length - 1].day);
  const forecast = [];
  
  for (let i = 1; i <= days; i++) {
    const forecastDay = new Date(lastDay);
    forecastDay.setDate(lastDay.getDate() + i);
    const dayKey = forecastDay.toISOString().split('T')[0];
    
    const forecastValue = intercept + slope * (n + i - 1);
    forecast.push({
      day: dayKey,
      amount: Math.max(0, forecastValue) // Prevent negative forecasts
    });
  }
  
  return forecast;
};


      // Update in the response preparation section:
    const dailyIncome = generateDailyData(incomeTransactions);
    const dailyExpenses = generateDailyData(expenseTransactions);


      // Prepare the response
    //   const monthlyIncome = generateMonthlyData(incomeTransactions);
    //   const monthlyExpenses = generateMonthlyData(expenseTransactions);
      
    //   const forecastIncome = generateForecast(monthlyIncome);
    //   const forecastExpenses = generateForecast(monthlyExpenses);
    const forecastIncome = generateForecast(dailyIncome);
    const forecastExpenses = generateForecast(dailyExpenses);

      const response = {
        statistics: {
          income: {
            average: incomeAmounts.length ? incomeAmounts.reduce((sum, amount) => sum + amount, 0) / incomeAmounts.length : 0,
            median: calculateMedian(incomeAmounts),
            mode: calculateMode(incomeAmounts),
            total: incomeAmounts.reduce((sum, amount) => sum + amount, 0),
            count: incomeAmounts.length
          },
          expenses: {
            average: expenseAmounts.length ? expenseAmounts.reduce((sum, amount) => sum + amount, 0) / expenseAmounts.length : 0,
            median: calculateMedian(expenseAmounts),
            mode: calculateMode(expenseAmounts),
            total: expenseAmounts.reduce((sum, amount) => sum + amount, 0),
            count: expenseAmounts.length
          }
        },
        chart: {
        //   income: monthlyIncome,
        //   expenses: monthlyExpenses,
            income: dailyIncome,
            expenses: dailyExpenses,
          forecast: {
            income: forecastIncome,
            expenses: forecastExpenses
          }
        }
      };
      await logActivity(pool, req.user.user_id, 'VIEW_FORECAST', 'REPORT', null, {
        start_date: start,
        end_date: end,
        transaction_count: transactions.length,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(response);
    } catch (error) {
      console.error('Error generating forecast:', error);
      res.status(500).json({ error: 'Failed to generate forecast' });
    }
  });

  return router;
};