const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const authMiddleware = require('../authMiddleware');
const { logActivity } = require('../logActivity');

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
          console.log(`path chartjs ${chartJsLib}`)
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

  return router;
};