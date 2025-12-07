import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

/*
  Design Philosophy: Swiss Style (International Typographic Style)
  - Grid-based alignment
  - High readability with Open Sans and Roboto
  - Clean, objective presentation of data
*/

// --- Types based on API docs ---

export type MatchStatus = "not_started" | "live" | "ended" | "cancelled";

export interface MarketOutcome {
  id: string;
  name: string; // e.g., "1", "x", "2", "Over", "Under"
  odds: number;
  active: boolean;
}

export interface Market {
  id: string;
  name: string; // e.g., "1x2", "Handicap", "Total"
  outcomes: MarketOutcome[];
}

export interface EventData {
  id: string;
  status: MatchStatus;
  scheduleTime: string; // ISO string
  matchTime?: string; // e.g., "68:32"
  matchStatus?: string; // e.g., "1st Round", "2nd Half"
  homeTeam: {
    name: string;
    logo: string;
    score: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    score: number;
  };
  markets: {
    main: Market; // 1x2
    handicap?: Market;
    total?: Market;
  };
  marketCount: number;
}

interface EventCardProps {
  className?: string;
  event?: EventData; // Optional for demo purposes, will use mock if not provided
  onCardClick?: (eventId: string) => void;
  onOutcomeClick?: (eventId: string, marketId: string, outcomeId: string) => void;
}

// --- Mock Data ---
const MOCK_EVENT: EventData = {
  id: "evt-001",
  status: "live",
  scheduleTime: "2025-12-07T15:00:00Z",
  matchTime: "68:32",
  matchStatus: "1st Round",
  homeTeam: {
    name: "Manchester United",
    logo: "/1-17219.webp",
    score: 1,
  },
  awayTeam: {
    name: "Liverpool",
    logo: "/1-17223.webp",
    score: 0,
  },
  markets: {
    main: {
      id: "mkt-1x2",
      name: "1x2",
      outcomes: [
        { id: "1", name: "1", odds: 1.90, active: true },
        { id: "x", name: "x", odds: 3.40, active: true },
        { id: "2", name: "2", odds: 4.20, active: true },
      ],
    },
    handicap: {
      id: "mkt-hdp",
      name: "Handicap",
      outcomes: [
        { id: "h1", name: "+1.5", odds: 1.85, active: true },
        { id: "h2", name: "-1.5", odds: 2.05, active: true },
      ],
    },
    total: {
      id: "mkt-tot",
      name: "Total",
      outcomes: [
        { id: "t1", name: "OVER 1.5", odds: 1.95, active: true },
        { id: "t2", name: "UNDER 1.5", odds: 1.85, active: true },
      ],
    },
  },
  marketCount: 120,
};

export default function EventCard({ 
  className, 
  event = MOCK_EVENT,
  onCardClick,
  onOutcomeClick 
}: EventCardProps) {
  const [selectedOutcomes, setSelectedOutcomes] = useState<Set<string>>(new Set());
  const [displayTime, setDisplayTime] = useState(event.matchTime);
  const [displayScore, setDisplayScore] = useState({ home: event.homeTeam.score, away: event.awayTeam.score });

  // Simulate WebSocket updates for Live events
  useEffect(() => {
    if (event.status !== 'live') return;

    const interval = setInterval(() => {
      // Simulate time ticking
      setDisplayTime(prev => {
        if (!prev) return "00:00";
        const [mins, secs] = prev.split(':').map(Number);
        let newSecs = secs + 1;
        let newMins = mins;
        if (newSecs >= 60) {
          newSecs = 0;
          newMins += 1;
        }
        return `${newMins.toString().padStart(2, '0')}:${newSecs.toString().padStart(2, '0')}`;
      });

      // Randomly update score occasionally (very low probability for demo)
      if (Math.random() > 0.995) {
        setDisplayScore(prev => ({
          ...prev,
          home: prev.home + (Math.random() > 0.5 ? 1 : 0),
          away: prev.away + (Math.random() > 0.5 ? 1 : 0)
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event.status]);

  const handleOutcomeClick = (e: React.MouseEvent, marketId: string, outcomeId: string) => {
    e.stopPropagation(); // Prevent card click
    const key = `${marketId}-${outcomeId}`;
    const newSelected = new Set(selectedOutcomes);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedOutcomes(newSelected);
    onOutcomeClick?.(event.id, marketId, outcomeId);
  };

  const handleCardClick = () => {
    onCardClick?.(event.id);
  };

  // Format date for pre-match
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return { date: `${yy} ${mm}/${dd}`, time: `${hh}:${min}` };
  };

  const renderTimeSection = () => {
    if (event.status === 'live') {
      return (
        <div className="flex flex-col items-start w-[79px] gap-1">
          <div className="flex items-center gap-2.5">
            {/* Live Indicator */}
            <div className="flex flex-col gap-2 w-3.5">
              <div className="relative w-3.5 h-[9px]">
                <div className="absolute left-0 top-0 w-3.5 h-[9px] rounded-sm border-[1.2px] border-[#0c9c16]" />
                <img 
                  src="/I1-17216;2-13758;2-13754.svg" 
                  className="absolute left-[5px] top-[2px] w-[5px] h-[5px] origin-top-left rotate-180 rounded-[0.4px]"
                  alt="live icon"
                />
              </div>
            </div>
            
            {/* Time */}
            <div className="flex items-center text-xs font-bold font-['Open_Sans'] leading-none">
              <span className="text-[#2e2e2e]">{displayTime}</span>
              <span className="text-[#e80104] ml-0.5">+17’</span>
            </div>
          </div>
          <div className="text-[#2e2e2e] text-xs font-normal font-['Open_Sans'] leading-none">
            {event.matchStatus}
          </div>
        </div>
      );
    } else {
      const { date, time } = formatDate(event.scheduleTime);
      return (
        <div className="flex flex-col items-start w-[79px] gap-1">
          <div className="text-[#2e2e2e] text-xs font-bold font-['Open_Sans'] leading-none">
            {date}
          </div>
          <div className="text-[#2e2e2e] text-xs font-normal font-['Open_Sans'] leading-none">
            {time}
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={cn(
        "group relative w-full max-w-[960px] h-20 bg-white/60 backdrop-blur-sm rounded-lg",
        "shadow-[-2px_-2px_22px_0px_rgba(0,0,0,0.02)] shadow-[inset_0px_0px_2px_0px_rgba(255,0,41,0.20)]",
        "border border-white hover:bg-white/85 transition-colors duration-200 cursor-pointer",
        "flex items-center px-4 gap-6 overflow-hidden",
        className
      )}
    >
      {/* Left Section: Match Info & Teams */}
      <div className="flex items-center gap-6 shrink-0">
        {renderTimeSection()}

        {/* Teams & Scores */}
        <div className="flex items-center gap-4">
          {/* Teams */}
          <div className="flex flex-col justify-between h-[42px] w-[164px]">
            {/* Home Team */}
            <div className="flex items-center gap-2">
              <img src={event.homeTeam.logo} className="w-[18px] h-[18px] rounded-full object-contain" alt={event.homeTeam.name} />
              <span className="text-[#2e2e2e] text-sm font-bold font-['Open_Sans'] truncate">{event.homeTeam.name}</span>
            </div>
            {/* Away Team */}
            <div className="flex items-center gap-2">
              <img src={event.awayTeam.logo} className="w-[18px] h-[18px] rounded-full object-contain" alt={event.awayTeam.name} />
              <span className="text-[#2e2e2e] text-sm font-bold font-['Open_Sans'] truncate">{event.awayTeam.name}</span>
            </div>
          </div>

          {/* Scores */}
          <div className="flex flex-col justify-between h-[42px]">
            <div className="text-[#2e2e2e] text-sm font-bold font-['Open_Sans'] leading-none flex items-center h-[18px]">
              {event.status === 'not_started' ? '-' : displayScore.home}
            </div>
            <div className="text-[#2e2e2e] text-sm font-bold font-['Open_Sans'] leading-none flex items-center h-[18px]">
              {event.status === 'not_started' ? '-' : displayScore.away}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Markets */}
      <div className="flex-1 flex justify-center items-start gap-3 h-[62px] overflow-hidden">
        {/* Spacer/Placeholder from design */}
        <div className="w-0 h-[58px] p-2.5" />

        {/* Market 1: 1x2 */}
        {event.markets.main && (
          <div className="flex flex-col items-center gap-1.5 w-[200px]">
            <div className="h-3.5 flex items-end">
              <span className="text-[#2e2e2e] text-xs font-medium font-['Roboto'] leading-none">{event.markets.main.name}</span>
            </div>
            <div className="flex w-full gap-1">
              {event.markets.main.outcomes.map(outcome => (
                <button 
                  key={outcome.id}
                  onClick={(e) => handleOutcomeClick(e, event.markets.main.id, outcome.id)}
                  className={cn(
                    "flex-1 h-10 rounded-lg border flex flex-col justify-center items-center transition-colors",
                    selectedOutcomes.has(`${event.markets.main.id}-${outcome.id}`)
                      ? "bg-[#2e2e2e] border-[#2e2e2e]"
                      : "bg-[#eff1f2] border-[#d0d0d0] hover:bg-[#e5e7eb]"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn(
                      "text-xs font-normal font-['Roboto'] leading-none",
                      selectedOutcomes.has(`${event.markets.main.id}-${outcome.id}`) ? "text-white" : "text-[#2e2e2e]"
                    )}>{outcome.name}</span>
                    <span className={cn(
                      "text-xs font-bold font-['Roboto'] leading-none",
                      selectedOutcomes.has(`${event.markets.main.id}-${outcome.id}`) ? "text-white" : "text-[#2e2e2e]"
                    )}>{outcome.odds.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Market 2: Handicap */}
        {event.markets.handicap && (
          <div className="flex flex-col items-center gap-1.5 w-[200px]">
            <div className="h-3.5 flex items-end">
              <span className="text-[#2e2e2e] text-xs font-medium font-['Roboto'] leading-none">{event.markets.handicap.name}</span>
            </div>
            <div className="flex w-full gap-1">
              {event.markets.handicap.outcomes.map(outcome => (
                <button 
                  key={outcome.id}
                  onClick={(e) => handleOutcomeClick(e, event.markets.handicap!.id, outcome.id)}
                  className={cn(
                    "flex-1 h-10 rounded-lg border flex flex-col justify-center items-center transition-colors",
                    selectedOutcomes.has(`${event.markets.handicap!.id}-${outcome.id}`)
                      ? "bg-[#2e2e2e] border-[#2e2e2e]"
                      : "bg-[#eff1f2] border-[#d0d0d0] hover:bg-[#e5e7eb]"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn(
                      "text-xs font-normal font-['Roboto'] leading-none",
                      selectedOutcomes.has(`${event.markets.handicap!.id}-${outcome.id}`) ? "text-white" : "text-[#2e2e2e]"
                    )}>{outcome.name}</span>
                    <span className={cn(
                      "text-xs font-bold font-['Roboto'] leading-none",
                      selectedOutcomes.has(`${event.markets.handicap!.id}-${outcome.id}`) ? "text-white" : "text-[#2e2e2e]"
                    )}>{outcome.odds.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Market 3: Total */}
        {event.markets.total && (
          <div className="flex flex-col items-center gap-1.5 w-[200px]">
            <div className="h-3.5 flex items-end">
              <span className="text-[#2e2e2e] text-xs font-medium font-['Roboto'] leading-none">{event.markets.total.name}</span>
            </div>
            <div className="flex w-full gap-1">
              {event.markets.total.outcomes.map(outcome => (
                <button 
                  key={outcome.id}
                  onClick={(e) => handleOutcomeClick(e, event.markets.total!.id, outcome.id)}
                  className={cn(
                    "flex-1 h-10 rounded-lg border flex flex-col justify-center items-center transition-colors",
                    selectedOutcomes.has(`${event.markets.total!.id}-${outcome.id}`)
                      ? "bg-[#2e2e2e] border-[#2e2e2e]"
                      : "bg-[#eff1f2] border-[#d0d0d0] hover:bg-[#e5e7eb]"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn(
                      "text-xs font-normal font-['Roboto'] leading-none",
                      selectedOutcomes.has(`${event.markets.total!.id}-${outcome.id}`) ? "text-white" : "text-[#2e2e2e]"
                    )}>{outcome.name}</span>
                    <span className={cn(
                      "text-xs font-bold font-['Roboto'] leading-none",
                      selectedOutcomes.has(`${event.markets.total!.id}-${outcome.id}`) ? "text-white" : "text-[#2e2e2e]"
                    )}>{outcome.odds.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Section: More Markets Button */}
      <div className="shrink-0 flex items-center justify-end w-[60px]">
        <button 
          onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
          className="h-9 px-2 bg-white rounded-lg shadow-sm border border-[#e5e7eb] flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
        >
          <span className="text-[#2e2e2e] text-xs font-bold font-['Roboto']">+{event.marketCount}</span>
          <ChevronRight className="w-3 h-3 text-[#2e2e2e]" />
        </button>
      </div>
    </div>
  );
}
