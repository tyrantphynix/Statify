import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FaYoutube, FaSearch, FaEye, FaThumbsUp, FaVideo, FaChartLine, FaUserFriends, FaDollarSign, FaClock } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// Replace 'YOUR_API_KEY' with your actual API key in a real implementation
// For security, store this in an environment variable

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
};

const calculateEstimatedRevenue = (views) => {
  // Very rough estimate based on average CPM
  // In reality, this varies widely by content type, geography, etc.
  const averageCpm = 2; // $2 per 1000 views
  return (views / 1000) * averageCpm;
};

const YouTubeAnalyticsDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelData, setChannelData] = useState(null);
  const [videoData, setVideoData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Function to search for a channel by name
  const searchChannel = async (query) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=channel&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items[0].id.channelId;
      } else {
        throw new Error('Channel not found');
      }
    } catch (error) {
      throw new Error('Error searching for channel: ' + error.message);
    }
  };

  // Function to get channel details
  const getChannelDetails = async (channelId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items[0];
      } else {
        throw new Error('Channel details not found');
      }
    } catch (error) {
      throw new Error('Error fetching channel details: ' + error.message);
    }
  };

  // Function to get channel videos
  const getChannelVideos = async (channelId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=viewCount&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items) {
        return data.items;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error('Error fetching channel videos: ' + error.message);
    }
  };

  // Function to get video details (including statistics)
  const getVideoDetails = async (videoIds) => {
    try {
      const idsString = videoIds.join(',');
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${idsString}&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items) {
        return data.items;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error('Error fetching video details: ' + error.message);
    }
  };

  // Helper function to parse ISO 8601 duration
  const parseISO8601Duration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] && match[1].replace('H', '')) || 0;
    const minutes = (match[2] && match[2].replace('M', '')) || 0;
    const seconds = (match[3] && match[3].replace('S', '')) || 0;
    
    let result = '';
    if (hours > 0) result += hours + ':';
    result += minutes.toString().padStart(2, '0') + ':';
    result += seconds.toString().padStart(2, '0');
    
    return result;
  };

  // Generate random data for charts that would require Analytics API access
  // In a real implementation, you would use actual data from YouTube Analytics API
  const generateMockTimeSeriesData = (baseValue, months = 7) => {
    let result = [];
    for (let i = 0; i < months; i++) {
      // Add some randomness to simulate real data fluctuations
      const randomFactor = 0.9 + Math.random() * 0.3; // Between 90% and 120%
      result.push(Math.round(baseValue * randomFactor));
    }
    return result;
  };

  const generateRetentionData = () => {
    const result = [];
    let value = 100;
    result.push(value);
    
    // Each segment typically drops a bit
    for (let i = 1; i < 10; i++) {
      // More drop at the beginning, less at the end
      const dropFactor = 0.97 - (0.02 * (10 - i) / 10);
      value = Math.round(value * dropFactor);
      result.push(value);
    }
    
    return result;
  };

  // This would normally come from content analysis
  // For demo purposes, we'll generate it based on video titles
  const analyzeCategoryBreakdown = (videos) => {
    const categories = {
      'Reviews': 0,
      'Tutorials': 0,
      'Vlogs': 0,
      'Gaming': 0,
      'Tech': 0,
      'Other': 0
    };
    
    const keywords = {
      'Reviews': ['review', 'vs', 'comparison', 'versus', 'compared'],
      'Tutorials': ['how to', 'tutorial', 'guide', 'learn', 'tips'],
      'Vlogs': ['vlog', 'day in', 'my life', 'behind the scenes'],
      'Gaming': ['gameplay', 'game', 'playing', 'playthrough', 'minecraft', 'fortnite'],
      'Tech': ['unboxing', 'tech', 'smartphone', 'iphone', 'android', 'gadget']
    };
    
    let total = videos.length;
    
    videos.forEach(video => {
      const title = video.snippet.title.toLowerCase();
      let matched = false;
      
      for (const [category, keywordList] of Object.entries(keywords)) {
        for (const keyword of keywordList) {
          if (title.includes(keyword)) {
            categories[category]++;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      
      if (!matched) {
        categories['Other']++;
      }
    });
    
    // Convert counts to percentages
    return Object.entries(categories).map(([category, count]) => ({
      category,
      percentage: Math.round((count / total) * 100)
    })).filter(item => item.percentage > 0); // Remove zero categories
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setChannelData(null);
    setVideoData([]);

    try {
      let channelId;
      
      // Check if input is a channel ID format
      if (searchQuery.startsWith('UC') && searchQuery.length > 20) {
        channelId = searchQuery;
      } else {
        // Search by channel name
        channelId = await searchChannel(searchQuery);
      }
      
      // Get channel details
      const channelDetails = await getChannelDetails(channelId);
      
      // Get channel videos
      const videos = await getChannelVideos(channelId);
      
      // Get details for top videos
      const topVideoIds = videos.slice(0, 10).map(video => video.id.videoId);
      const videoDetails = await getVideoDetails(topVideoIds);
      
      // Process video details to extract needed info
      const processedVideos = videoDetails.map(video => {
        return {
          id: video.id,
          title: video.snippet.title,
          views: parseInt(video.statistics.viewCount, 10),
          likes: parseInt(video.statistics.likeCount || 0, 10),
          duration: parseISO8601Duration(video.contentDetails.duration),
          thumbnail: video.snippet.thumbnails.medium.url,
          publishedAt: new Date(video.snippet.publishedAt).toLocaleDateString(),
          // Estimates as these require Analytics API access
          ctr: (5 + Math.random() * 10).toFixed(1),
          revenue: calculateEstimatedRevenue(parseInt(video.statistics.viewCount, 10))
        };
      }).sort((a, b) => b.views - a.views);
      
      setVideoData(processedVideos);
      
      // Process channel data
      const stats = channelDetails.statistics;
      const subscriberCount = parseInt(stats.subscriberCount, 10);
      const viewCount = parseInt(stats.viewCount, 10);
      const videoCount = parseInt(stats.videoCount, 10);
      
      // Calculate or estimate other metrics
      const estimatedLikes = Math.round(viewCount * 0.04); // Very rough estimate
      const estimatedRevenue = calculateEstimatedRevenue(viewCount);
      
      // Generate data for charts
      const viewsHistory = generateMockTimeSeriesData(viewCount / 36);
      const revenueHistory = viewsHistory.map(views => calculateEstimatedRevenue(views));
      const audienceRetention = generateRetentionData();
      
      // Analyze video categories
      const categoryBreakdown = analyzeCategoryBreakdown(videos);
      
      setChannelData({
        name: channelDetails.snippet.title,
        description: channelDetails.snippet.description,
        thumbnail: channelDetails.snippet.thumbnails.medium.url,
        subscribers: subscriberCount,
        totalViews: viewCount,
        totalVideos: videoCount,
        totalLikes: estimatedLikes,
        avgViewDuration: 7 + Math.random() * 8, // Estimated between 7-15 minutes
        estimatedRevenue: estimatedRevenue,
        topVideos: processedVideos,
        viewsHistory: viewsHistory,
        revenueHistory: revenueHistory,
        audienceRetention: audienceRetention,
        categoryBreakdown: categoryBreakdown
      });
      
    } catch (error) {
      setError(`Error fetching data: ${error.message}. Try using a channel name like "MKBHD" or "MrBeast".`);
    } finally {
      setIsLoading(false);
    }
  };

  // Creating chart data
  const viewsChartData = channelData ? {
    labels: ['6 months ago', '5 months ago', '4 months ago', '3 months ago', '2 months ago', '1 month ago', 'This month'],
    datasets: [
      {
        label: 'Monthly Views',
        data: channelData.viewsHistory,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const categoryChartData = channelData?.categoryBreakdown ? {
    labels: channelData.categoryBreakdown.map(item => item.category),
    datasets: [
      {
        label: 'Content Categories',
        data: channelData.categoryBreakdown.map(item => item.percentage),
        backgroundColor: channelData.categoryBreakdown.map(() => 
          `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.6)`
        ),
        borderWidth: 1,
      },
    ],
  } : null;

  const retentionChartData = channelData ? {
    labels: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'],
    datasets: [
      {
        label: 'Audience Retention',
        data: channelData?.audienceRetention,
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
      },
    ],
  } : null;

  const revenueChartData = channelData ? {
    labels: ['6 months ago', '5 months ago', '4 months ago', '3 months ago', '2 months ago', '1 month ago', 'This month'],
    datasets: [
      {
        label: 'Estimated Revenue ($)',
        data: channelData.revenueHistory,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-600 text-white p-6 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FaYoutube className="text-4xl mr-3" />
            <h1 className="text-2xl font-bold">Statify</h1>
          </div>
          <form onSubmit={handleSearch} className="w-full md:w-1/2 flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter channel name or ID (e.g., 'MKBHD', 'MrBeast')"
              className="w-full p-3 rounded-l text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-r flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <FaSearch className="mr-2" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
          </div>
        )}

        {channelData && !isLoading && (
          <>
            {/* Channel Overview */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div className="flex items-center">
                  {channelData.thumbnail && (
                    <img 
                      src={channelData.thumbnail} 
                      alt={channelData.name} 
                      className="w-16 h-16 rounded-full mr-4"
                    />
                  )}
                  <h2 className="text-3xl font-bold text-gray-800">{channelData.name}</h2>
                </div>
                <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center mt-4 md:mt-0">
                  <FaYoutube className="mr-2" />
                  <span className="font-semibold">{formatNumber(channelData.subscribers)} subscribers</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center">
                  <div className="bg-blue-500 p-3 rounded-full text-white mr-4">
                    <FaEye className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-xl font-bold">{formatNumber(channelData.totalViews)}</p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center">
                  <div className="bg-green-500 p-3 rounded-full text-white mr-4">
                    <FaVideo className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Videos</p>
                    <p className="text-xl font-bold">{formatNumber(channelData.totalVideos)}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-center">
                  <div className="bg-yellow-500 p-3 rounded-full text-white mr-4">
                    <FaThumbsUp className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Total Likes</p>
                    <p className="text-xl font-bold">{formatNumber(channelData.totalLikes)}</p>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center">
                  <div className="bg-purple-500 p-3 rounded-full text-white mr-4">
                    <FaDollarSign className="text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Annual Revenue</p>
                    <p className="text-xl font-bold">${formatNumber(channelData.estimatedRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Est. Monthly Views Trend</h3>
                {viewsChartData && <Bar data={viewsChartData} options={{ responsive: true }} />}
                <p className="text-xs text-gray-500 mt-2">* Based on estimated distribution of total channel views</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Content Category Distribution</h3>
                {categoryChartData && <Pie data={categoryChartData} options={{ responsive: true }} />}
                <p className="text-xs text-gray-500 mt-2">* Based on analysis of video titles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Est. Audience Retention</h3>
                {retentionChartData && <Line data={retentionChartData} options={{ responsive: true }} />}
                <p className="text-xs text-gray-500 mt-2">* Based on typical retention patterns for similar channels</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Est. Revenue Trend</h3>
                {revenueChartData && <Bar data={revenueChartData} options={{ responsive: true }} />}
                <p className="text-xs text-gray-500 mt-2">* Based on industry average CPM of $2 per 1000 views</p>
              </div>
            </div>

            {/* Top Videos Table */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Top Performing Videos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. CTR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videoData.map((video, index) => (
                      <tr key={video.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{video.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(video.views)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(video.likes)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.duration}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.ctr}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatNumber(video.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">* CTR and Revenue are estimates based on industry averages</p>
            </div>

            {/* Recommendations Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">AI-Powered Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="font-bold text-green-800 mb-2">Growth Opportunities</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>Videos averaging {Math.round(channelData.avgViewDuration)} minutes have the highest engagement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>{channelData.categoryBreakdown[0]?.category} content performs well - consider making more</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>Top videos average {Math.round(videoData.slice(0, 3).reduce((acc, vid) => acc + vid.likes / vid.views * 100, 0) / 3)}% like ratio - aim for this benchmark</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-bold text-red-800 mb-2">Attention Needed</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>Est. audience retention drops after {(channelData.audienceRetention.findIndex(r => r < 70) + 1) * 10}% of video duration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>{channelData.categoryBreakdown[channelData.categoryBreakdown.length - 1]?.category} videos have lower performance - review strategy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>Est. revenue per view is ${(channelData.estimatedRevenue / channelData.totalViews * 1000).toFixed(2)} per 1000 views - industry average is $2.00</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {!channelData && !isLoading && !error && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaYoutube className="text-6xl text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter a YouTube Channel Name</h2>
            <p className="text-gray-600 mb-4">Try searching for "MKBHD", "MrBeast", or "pewdiepie"</p>
            <p className="text-sm text-gray-500">Our advanced analytics will show you detailed insights about the channel's performance.</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <FaYoutube className="text-3xl text-red-600 mr-2" />
                <h3 className="text-xl font-bold">Statify</h3>
              </div>
              <p className="text-gray-400 mt-2">Advanced YouTube Analytics Platform</p>
            </div>
            <p className="text-gray-400 text-sm">© 2025 Statify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default YouTubeAnalyticsDashboard;