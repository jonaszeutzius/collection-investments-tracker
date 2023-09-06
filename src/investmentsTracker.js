import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const InvestmentsTracker = () => {
  const [contractAddress, setcontractAddress] = useState('');
  const [blockchain, setBlockchain] = useState('eth-main');
  const [timeframe, setTimeframe] = useState('1_DAY');
  const [timeframeNumber, setTimeframeNumber] = useState(1);
  const [binsize, setBinsize] = useState('1_HOUR');
  const [todaysData, setTodaysData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  const bins = {
    '1_DAY': '1_HOUR',
    '7_DAYS': '1_DAY',
    '30_DAYS': '1_DAY',
  };

  const metrics = {
    'Total Sales': 'total_sales',
    'Unique Tokens': 'total_unique_tokens',
    'Average Price (USD)': 'avg_price_usd',
    'Max Price (USD)': 'max_price_usd',
    'Total Sales Volume (USD)': 'total_sales_volume_usd',
  };

  const retrieveData = async () => {
    if (!contractAddress.trim()) {
      setError('Contract address is required.');
      setTodaysData(null)
      setPreviousData(null)
      return;
    }

    setTodaysData(null);
    setPreviousData(null);
    setHasClicked(true);
    setLoading(true);

    const currentUTCDate = new Date();
    const currentUTCDateString = currentUTCDate.toISOString();

    if (timeframe === '1_DAY') {
      setTimeframeNumber(1);
    } else if (timeframe === '7_DAYS') {
      setTimeframeNumber(7);
    } else if (timeframe === '30_DAYS') {
      setTimeframeNumber(30);
    }

    const oldUTCDate = new Date(
      currentUTCDate.getTime() - timeframeNumber * 24 * 60 * 60 * 1000
    );
    const oldUTCDateString = oldUTCDate.toISOString();

    setBinsize(bins[timeframe]);
    const params = `contract_address=${contractAddress}&chain=${blockchain}&timeframe=${timeframe}&bin_size=${binsize}`;

    const url1 = `https://api.blockspan.com/v1/nfts/nfthistory?timestamp_end=${currentUTCDateString}&${params}`;
    const url2 = `https://api.blockspan.com/v1/nfts/nfthistory?timestamp_end=${oldUTCDateString}&${params}`;
    const headers = {
      accept: 'application/json',
      'X-API-KEY': 'YOUR_BLOCKSPAN_API_KEY',
    };

    try {
      const response1 = await axios.get(url1, { headers });
      const response2 = await axios.get(url2, { headers });
      setTodaysData(response1.data);
      console.log('Today:', todaysData);
      setPreviousData(response2.data);
      console.log('Previous:', previousData);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error(error);
      error.response.status === 401
        ? setError('Invalid blockspan API key!')
        : setError('Error: verify chain and contract address are valid');
      setTodaysData(null);
      setPreviousData(null);
      setLoading(false);
    }
  };

  function formatData(data) {
    if (typeof data === 'string' && !isNaN(Number(data))) {
      return Number(data).toFixed(2); // Round to two decimal places for floats
    } else {
      return data; // Leave it as is for non-floats
    }
  }

  function calculatePercentageChange(previousValue, currentValue) {
    if (
      typeof previousValue === 'number' &&
      typeof currentValue === 'number' &&
      !isNaN(previousValue) &&
      !isNaN(currentValue) &&
      previousValue !== 0
    ) {
      return ((currentValue / previousValue - 1) * 100).toFixed(2); // Calculate and round to two decimal places
    } else {
      return '';
    }
  }

  return (
    <div>
      <h1 className="title">Collection Investments Tracker</h1>
      <p className="message">
        Select a blockchain and timeframe, then input a contract address to see
        how sales data has changed.
      </p>
      <div className="inputContainer">
        <select
          name="blockchain"
          value={blockchain}
          onChange={(e) => setBlockchain(e.target.value)}
        >
          <option value="eth-main">eth-main</option>
          <option value="arbitrum-main">arbitrum-main</option>
          <option value="optimism-main">optimism-main</option>
          <option value="poly-main">poly-main</option>
          <option value="bsc-main">bsc-main</option>
          <option value="eth-goerli">eth-goerli</option>
        </select>
        <select
          name="timeframe"
          value={timeframe}
          onChange={(e) => {
            setTimeframe(e.target.value);
            setBinsize(bins[e.target.value]);
          }}
        >
          <option value="1_DAY">1 Day</option>
          <option value="7_DAYS">7 Days</option>
          <option value="30_DAYS">30 Days</option>
        </select>
        <input
          type="text"
          placeholder="Contract Address"
          value={contractAddress}
          onChange={(e) => setcontractAddress(e.target.value)}
        />
        <button onClick={retrieveData}>Retrieve Data</button>
      </div>
      {loading ? (
        <p className="message">Loading...</p>
      ) : (
        <>
          {error && <p className="errorMessage">{error}</p>}
          {hasClicked && (
            <>
              {todaysData?.total_sales === 0 && previousData?.total_sales === 0 ? (
                <p className="errorMessage">
                  No sales data found. Verify chain, address, and timeframe.
                </p>
              ) : (
                <div>
                  {todaysData !== null && previousData !== null && (
                    <>
                      <p className="message">
                        The current data represents sales data from today back to{' '}
                        {timeframeNumber}{' '}
                        {timeframeNumber === 1 ? 'day' : 'days'} ago.
                      </p>
                      <p className="message">
                        The data from {timeframeNumber}{' '}
                        {timeframeNumber === 1 ? 'day' : 'days'} ago is over the
                        same timeframe but starting {timeframeNumber} days ago.
                      </p>
                      <table className="tableContainer">
                        <thead>
                          <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th>Sales Data</th>
                            <th>
                              {timeframeNumber} day
                              {timeframeNumber === 1 ? '' : 's'} ago
                            </th>
                            <th>Today</th>
                            <th>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(metrics).map((key) => (
                            <tr
                              style={{ backgroundColor: '#f2f2f2' }}
                              key={key}
                            >
                              <td>{key}</td>
                              <td>
                                {formatData(previousData[metrics[key]])}
                              </td>
                              <td>{formatData(todaysData[metrics[key]])}</td>
                              <td
                                style={{
                                  color:
                                    calculatePercentageChange(
                                      Number(previousData[metrics[key]]),
                                      Number(todaysData[metrics[key]])
                                    ) < 0
                                      ? 'red'
                                      : 'green',
                                }}
                              >
                                {calculatePercentageChange(
                                  Number(previousData[metrics[key]]),
                                  Number(todaysData[metrics[key]])
                                ) > 0
                                  ? `+${calculatePercentageChange(
                                      Number(previousData[metrics[key]]),
                                      Number(todaysData[metrics[key]])
                                    )}%`
                                  : `${calculatePercentageChange(
                                      Number(previousData[metrics[key]]),
                                      Number(todaysData[metrics[key]])
                                    )}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default InvestmentsTracker;
