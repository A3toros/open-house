import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * TestPerformanceGraph Component
 * 
 * Simple line graph showing test performance over time with dots for each test.
 * - Time horizontally (X-axis)
 * - Percentage vertically (Y-axis) 
 * - Dots represent individual tests
 * - Line shows performance progression
 */
export const TestPerformanceGraph = ({ data = [], loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h5 className="alert-heading">Error Loading Performance Data</h5>
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <h5>No Test Data Available</h5>
          <p>No tests have been completed yet for the current term.</p>
        </div>
      </div>
    );
  }

  // Process data for the graph
  const graphData = data.map(item => ({
    testName: item.test_name,
    testDate: item.submitted_at,
    averageScore: parseFloat(item.average_score),
    totalStudents: item.total_students,
    testId: item.test_id
  }));

  return (
    <div className="test-performance-graph">
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="testDate"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
              }}
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="#666"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${parseFloat(value).toFixed(1)}%`, 
                'Average Score'
              ]}
              labelFormatter={(label) => {
                const test = graphData.find(d => d.testDate === label);
                if (test) {
                  const date = new Date(label);
                  return `${test.testName} (${date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })})`;
                }
                return label;
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="averageScore"
              stroke="#007bff"
              strokeWidth={3}
              connectNulls={true}
              dot={{ 
                r: 6, 
                fill: '#007bff',
                stroke: '#fff',
                strokeWidth: 2
              }}
              activeDot={{ 
                r: 8, 
                fill: '#ff6b35',
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Test Statistics */}
      <div className="mt-3">
        <div className="row">
          <div className="col-md-3">
            <div className="text-center">
              <span className="text-muted">Total Tests: </span>
              <strong>{graphData.length}</strong>
            </div>
          </div>
          <div className="col-md-3">
            <div className="text-center">
              <span className="text-muted">Average Score: </span>
              <strong>
                {graphData.length > 0 
                  ? (() => {
                      const validScores = graphData.filter(test => 
                        test.averageScore !== null && 
                        test.averageScore !== undefined && 
                        !isNaN(test.averageScore)
                      );
                      if (validScores.length === 0) return 'N/A';
                      const average = validScores.reduce((sum, test) => sum + test.averageScore, 0) / validScores.length;
                      return `${average.toFixed(1)}%`;
                    })()
                  : 'N/A'
                }
              </strong>
            </div>
          </div>
          <div className="col-md-3">
            <div className="text-center">
              <span className="text-muted">Best Test: </span>
              <strong>
                {graphData.length > 0 
                  ? (() => {
                      const validScores = graphData.filter(test => 
                        test.averageScore !== null && 
                        test.averageScore !== undefined && 
                        !isNaN(test.averageScore)
                      );
                      if (validScores.length === 0) return 'N/A';
                      return validScores.reduce((best, test) => test.averageScore > best.averageScore ? test : best).testName;
                    })()
                  : 'N/A'
                }
              </strong>
            </div>
          </div>
          <div className="col-md-3">
            <div className="text-center">
              <span className="text-muted">Latest Test: </span>
              <strong>
                {graphData.length > 0 
                  ? graphData[graphData.length - 1].testName
                  : 'N/A'
                }
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
