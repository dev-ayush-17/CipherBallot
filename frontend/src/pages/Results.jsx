import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useMetaMask from '../hooks/useMetaMask';
import useVotingContract from '../hooks/useVotingContract';

/*
 * Results.jsx — Election Results Dashboard
 * Connected to real on-chain data via useVotingContract.
 * Shows bar chart + pie chart + candidate breakdown with live vote counts.
 */

const CHART_COLORS = ['#1a1a1a', '#3B82F6', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];

export default function Results() {
  const { account } = useMetaMask();
  const {
    elections,
    currentElection,
    currentElectionId,
    selectElection,
    candidates,
    electionPhase,
    electionName,
    loading,
    getResults,
  } = useVotingContract(account);

  const [resultsData, setResultsData] = useState({ names: [], voteCounts: [] });

  // Fetch results on mount / election change
  useEffect(() => {
    const fetchResults = async () => {
      const data = await getResults();
      setResultsData(data);
    };
    if (currentElectionId) {
      fetchResults();
    }
  }, [currentElectionId, getResults]);

  // Build chart data
  const chartData = useMemo(() => {
    if (candidates.length > 0) {
      return candidates.map((c, i) => ({
        name: c.name,
        votes: c.voteCount,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
    }
    if (resultsData.names.length > 0) {
      return resultsData.names.map((name, i) => ({
        name,
        votes: resultsData.voteCounts[i] || 0,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
    }
    return [];
  }, [candidates, resultsData]);

  const totalVotes = useMemo(() => chartData.reduce((sum, d) => sum + d.votes, 0), [chartData]);

  const winner = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, c) => (c.votes > max.votes ? c : max), chartData[0]);
  }, [chartData]);

  const pieData = useMemo(() => {
    if (totalVotes === 0) return [];
    return chartData.map((d) => ({
      ...d,
      percentage: ((d.votes / totalVotes) * 100).toFixed(1),
    }));
  }, [chartData, totalVotes]);

  return (
    <div className="min-h-screen bg-terminal-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="protocol-heading text-4xl leading-none">Results Ledger</h1>
            <p className="text-sm text-terminal-grey mt-2">
              {currentElection
                ? `${currentElection.name} — ${electionPhase} Phase`
                : 'No election data available'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {elections.length > 1 && (
              <select
                value={currentElectionId || ''}
                onChange={(e) => selectElection(Number(e.target.value))}
                className="text-xs font-mono border border-terminal-black/15 px-3 py-2 focus:outline-none focus:border-terminal-black"
              >
                {elections.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            )}
            <Link
              to="/dashboard"
              className="btn-protocol-secondary text-xs px-4 py-2"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="protocol-divider-strong mb-8" />

        {/* ─── Loading ─── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-protocol-blue border-t-transparent rounded-full animate-spin" />
            <span className="ml-4 text-sm text-terminal-grey">Loading results from blockchain...</span>
          </div>
        )}

        {/* ─── No data ─── */}
        {!loading && chartData.length === 0 && (
          <div className="protocol-card p-12 bg-white text-center">
            <svg className="w-16 h-16 mx-auto text-terminal-grey/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-sm text-terminal-grey">No results available yet.</p>
            <p className="text-xs text-terminal-grey/60 mt-1">Results will appear once candidates are registered and votes are cast.</p>
          </div>
        )}

        {/* ─── Results Content ─── */}
        {!loading && chartData.length > 0 && (
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="protocol-card bg-white p-5">
                <p className="text-[10px] font-mono uppercase tracking-protocol text-terminal-grey">Total Votes</p>
                <p className="font-mono text-3xl font-black text-terminal-black mt-1">{totalVotes}</p>
              </div>
              <div className="protocol-card bg-white p-5">
                <p className="text-[10px] font-mono uppercase tracking-protocol text-terminal-grey">Candidates</p>
                <p className="font-mono text-3xl font-black text-terminal-black mt-1">{chartData.length}</p>
              </div>
              <div className="protocol-card bg-white p-5">
                <p className="text-[10px] font-mono uppercase tracking-protocol text-terminal-grey">Phase</p>
                <p className={`font-mono text-xl font-black mt-1 ${
                  electionPhase === 'Active' ? 'text-green-600' : electionPhase === 'Ended' ? 'text-terminal-black' : 'text-amber-600'
                }`}>{electionPhase}</p>
              </div>
              <div className="bg-protocol-blue text-white p-5">
                <p className="text-[10px] font-mono uppercase tracking-protocol opacity-80">Leading</p>
                <p className="font-mono text-lg font-black mt-1 truncate">{winner?.name || '—'}</p>
                <p className="text-xs opacity-75">{winner?.votes || 0} votes</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart */}
              <div className="protocol-card bg-white p-6 lg:col-span-2">
                <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-6">Vote Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#666' }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: '1px solid #1a1a1a', borderRadius: 0 }}
                    />
                    <Bar dataKey="votes" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="protocol-card bg-white p-6">
                <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-6">Vote Share</h3>
                {totalVotes > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="votes"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`pie-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} votes`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3" style={{ backgroundColor: d.fill }} />
                            <span className="font-semibold text-terminal-black truncate max-w-[120px]">{d.name}</span>
                          </div>
                          <span className="font-mono text-terminal-grey">{d.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-xs text-terminal-grey">No votes cast yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Breakdown Table */}
            <div className="protocol-card bg-white p-6">
              <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">Candidate Breakdown</h3>
              <div className="protocol-divider mb-4" />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-mono uppercase tracking-protocol text-terminal-grey border-b border-gray-200">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Candidate</th>
                      <th className="pb-3 pr-4">CGPA</th>
                      <th className="pb-3 pr-4 text-right">Votes</th>
                      <th className="pb-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData
                      .sort((a, b) => b.votes - a.votes)
                      .map((candidate, idx) => {
                        const matchingCandidate = candidates.find((c) => c.name === candidate.name);
                        return (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 pr-4 font-mono text-xs text-terminal-grey">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-3 h-3 flex-shrink-0"
                                  style={{ backgroundColor: candidate.fill }}
                                />
                                <span className="text-sm font-semibold text-terminal-black">{candidate.name}</span>
                                {idx === 0 && totalVotes > 0 && (
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-protocol-blue text-white">
                                    Leading
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-terminal-grey">
                              {matchingCandidate?.cgpa || '—'}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono text-sm font-bold text-terminal-black">
                              {candidate.votes}
                            </td>
                            <td className="py-3 text-right font-mono text-xs text-terminal-grey">
                              {totalVotes > 0 ? `${((candidate.votes / totalVotes) * 100).toFixed(1)}%` : '0%'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
