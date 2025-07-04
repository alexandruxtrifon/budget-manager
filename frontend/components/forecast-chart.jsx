"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export function ForecastChart({ historicalData, forecastData, type }) {
  const [combinedData, setCombinedData] = useState([]);

  useEffect(() => {
    if (!historicalData || !forecastData) return;

    try {
      // Determine if we're using day or month format
      const firstHistoricalItem = historicalData[0] || {};
      const dateKey = firstHistoricalItem.day !== undefined ? 'day' : 'month';
      
      // Create a map of all data points
      const allDataMap = {};
      
      // Add historical data to the map
      historicalData.forEach(item => {
        const key = item[dateKey];
        if (!key) return; // Skip invalid data
        
        allDataMap[key] = { 
          date: key, 
          formattedDate: formatDate(key), 
          actual: item.amount 
        };
      });
      
      // Add forecast data to the map
      forecastData.forEach(item => {
        const key = item[dateKey];
        if (!key) return; // Skip invalid data
        
        if (allDataMap[key]) {
          allDataMap[key].forecast = item.amount;
        } else {
          allDataMap[key] = { 
            date: key, 
            formattedDate: formatDate(key), 
            forecast: item.amount 
          };
        }
      });
      
      // Convert map to array and sort by date
      const combined = Object.values(allDataMap).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      
      setCombinedData(combined);
    } catch (error) {
      console.error("Error processing chart data:", error);
      setCombinedData([]);
    }
  }, [historicalData, forecastData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown";
    
    try {
      const parts = dateStr.split('-');
      
      // Check if it's a full date (YYYY-MM-DD) or just month (YYYY-MM)
      if (parts.length === 3) {
        // Day format
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (parts.length === 2) {
        // Month format
        const [year, month] = parts;
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        return dateStr; // Return as is if we can't parse
      }
    } catch (error) {
      console.error("Error formatting date:", dateStr, error);
      return "Invalid date";
    }
  };
  
  // Format tooltip values
  const formatValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Find the transition point between actual and forecast data
  const findTransitionPoint = () => {
    for (let i = 0; i < combinedData.length; i++) {
      if (combinedData[i].forecast && !combinedData[i].actual) {
        return i > 0 ? combinedData[i-1].date : null;
      }
    }
    return null;
  };
  
  const transitionPoint = findTransitionPoint();
  
  // Set line color based on type
  const lineColor = type === 'income' ? '#22c55e' : '#ef4444';
  const forecastColor = type === 'income' ? '#86efac' : '#fca5a5';
  if (combinedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available for the selected period</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={combinedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="formattedDate" 
          padding={{ left: 30, right: 30 }}
          interval={combinedData.length > 20 ? "preserveStartEnd" : 0} 
          angle={combinedData.length > 20 ? -45 : 0}
          textAnchor={combinedData.length > 20 ? "end" : "middle"}
          height={combinedData.length > 20 ? 60 : 30}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={formatValue} 
          width={80} 
        />
        <Tooltip 
          formatter={(value) => [formatValue(value), 'Amount']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend 
          payload={[
            { value: 'Historical Data', type: 'line', color: lineColor },
            { value: 'Forecast (Projected)', type: 'line', color: forecastColor }
          ]} 
        />
        
        {/* Historical data line */}
        <Line
          type="monotone"
          dataKey="actual"
          name="Historical"
          stroke={lineColor}
          strokeWidth={3}
          dot={combinedData.length > 30 ? { r: 2 } : { r: 4 }}
          activeDot={{ r: 6 }}
        />
        
        {/* Forecast data line */}
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke={forecastColor}
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={combinedData.length > 30 ? 
              { r: 2, strokeWidth: 1, stroke: forecastColor, fill: 'white' } : 
              { r: 4, strokeWidth: 1, stroke: forecastColor, fill: 'white' }
          }
        />
        
        {/* Reference line showing where forecast begins */}
        {transitionPoint && (
          <ReferenceLine
            x={formatDate(transitionPoint)}
            stroke="#888"
            strokeDasharray="3 3"
            label={{ value: 'Forecast Start', position: 'insideTopRight' }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}