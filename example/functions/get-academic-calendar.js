/**
 * Get Academic Calendar
 * 
 * Serves academic calendar data from static JSON file.
 * Eliminates database queries for academic period detection.
 * 
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} Response with academic calendar data
 */

const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Minimal proxy to public JSON; no filesystem logic needed now
    const url = process.env.PUBLIC_ACAD_CAL_URL || 'https://mathayomwatsing.netlify.app/academic_year.json';
    const academicCalendar = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const ct = res.headers['content-type'] || '';
        if (!ct.includes('application/json')) {
          reject(new Error('Non-JSON response'));
          return;
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    if (!Array.isArray(academicCalendar)) {
      throw new Error('Invalid academic calendar format');
    }

    console.log('📅 Academic calendar loaded:', academicCalendar.length, 'terms');
    
    // Generate ETag for caching (static data - long cache time)
    const dataString = JSON.stringify({ academic_calendar: academicCalendar, total_terms: academicCalendar.length });
    const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200', // 1 hour + 2 hour stale
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({
        success: true,
        academic_calendar: academicCalendar,
        total_terms: academicCalendar.length,
        message: 'Academic calendar loaded successfully'
      })
    };
  } catch (error) {
    console.error('📅 Error loading academic calendar:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to load academic calendar',
        message: error.message
      })
    };
  }
};
