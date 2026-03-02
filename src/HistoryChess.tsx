import { Chess } from "chess.js";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { RotateCcw, Swords, Crown, Shield, Clock, ChevronLeft, ChevronRight, Save, Database, Settings, X, Rewind, FastForward } from "lucide-react";

// ─── Piece image map ────────────────────────────────────────────────────────
const PIECE_MAP: Record<string, string> = {
    wR: "w_rook.png", wN: "w_knight.png", wB: "w_bishop.png", wQ: "w_queen.png", wK: "w_king.png", wP: "w_pawn.png",
    bR: "b_rook.png", bN: "b_knight.png", bB: "b_bishop.png", bQ: "b_queen.png", bK: "b_king.png", bP: "b_pawn.png",
};

// ─── Custom piece renderers ──────────────────────────────────────────────────
const customPieces = Object.keys(PIECE_MAP).reduce((acc, piece) => {
    acc[piece] = () => (
        <img
            src={`/pieces/${PIECE_MAP[piece]}?v=5`}
            alt={`${piece} piece`}
            style={{
                width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none",
                filter: "drop-shadow(1px 3px 4px rgba(0,0,0,0.8)) drop-shadow(0 8px 12px rgba(0,0,0,0.45)) drop-shadow(0 0 6px rgba(200,170,100,0.15))",
                transform: "translateY(-2px)",
            }}
        />
    );
    return acc;
}, {} as Record<string, any>);

// ─── Formatting ───────────────────────────────────────────────────────────────
function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HistoryChess() {
    const [game, setGame] = useState(new Chess());
    const [moveHistory, setMoveHistory] = useState<string[]>([]);

    // Timer
    const [timeControl, setTimeControl] = useState(10 * 60); // 10 mins default
    const [whiteTime, setWhiteTime] = useState(10 * 60);
    const [blackTime, setBlackTime] = useState(10 * 60);
    const [hasStarted, setHasStarted] = useState(false);

    // History Viewer (-1 means viewing live, else index of moveHistory)
    const [viewIndex, setViewIndex] = useState(-1);

    // UI Modals
    const [activeModal, setActiveModal] = useState<"none" | "settings" | "load">("none");
    const [savedMatches, setSavedMatches] = useState<any[]>([]);

    useEffect(() => {
        const loaded = localStorage.getItem("imperial_chess_matches");
        if (loaded) setSavedMatches(JSON.parse(loaded));
    }, []);

    const saveMatch = () => {
        const match = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            pgn: game.pgn(),
            result: game.isGameOver() ? (game.isCheckmate() ? (game.turn() === 'w' ? 'Black Won' : 'White Won') : 'Draw') : 'Unfinished'
        };
        const newMatches = [match, ...savedMatches].slice(0, 10);
        setSavedMatches(newMatches);
        localStorage.setItem("imperial_chess_matches", JSON.stringify(newMatches));
        alert("Match saved to local storage!");
    };

    const loadMatch = (pgn: string) => {
        const g = new Chess();
        g.loadPgn(pgn);
        setGame(g);
        setMoveHistory(g.history());
        setViewIndex(-1);
        setWhiteTime(timeControl);
        setBlackTime(timeControl);
        setHasStarted(false);
        setActiveModal("none");
    };

    const isGameOver = game.isGameOver() || whiteTime === 0 || blackTime === 0;

    // Timer Effect
    useEffect(() => {
        if (!hasStarted || isGameOver || viewIndex !== -1) return;
        const interval = setInterval(() => {
            if (game.turn() === "w") {
                setWhiteTime((t) => Math.max(0, t - 1));
            } else {
                setBlackTime((t) => Math.max(0, t - 1));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [hasStarted, isGameOver, game, viewIndex]);

    const viewingGame = useMemo(() => {
        if (viewIndex === -1) return game;
        const vg = new Chess();
        if (viewIndex >= 0) {
            for (let i = 0; i <= viewIndex; i++) {
                vg.move(moveHistory[i]);
            }
        }
        return vg;
    }, [game, moveHistory, viewIndex]);

    const makeMove = useCallback(
        (move: any) => {
            if (isGameOver && viewIndex === -1) return null;

            let g = game;

            // If making a move while viewing history, truncate and branch!
            if (viewIndex !== -1) {
                g = new Chess();
                for (let i = 0; i <= viewIndex; i++) g.move(moveHistory[i]);
                const nextHistory = moveHistory.slice(0, viewIndex + 1);
                setMoveHistory(nextHistory);
                setViewIndex(-1);
            }

            const next = new Chess(g.fen());
            try {
                const result = next.move(move);
                if (result) {
                    setGame(next);
                    setMoveHistory(h => viewIndex !== -1 ? [...moveHistory.slice(0, viewIndex + 1), result.san] : [...h, result.san]);
                    if (!hasStarted) setHasStarted(true);
                    return result;
                }
            } catch (_) { }
            return null;
        },
        [game, viewIndex, moveHistory, hasStarted, isGameOver]
    );

    function onDrop({ sourceSquare, targetSquare }: any) {
        if (!targetSquare) return false;
        return makeMove({ from: sourceSquare, to: targetSquare, promotion: "q" }) !== null;
    }

    function handleReset() {
        setGame(new Chess());
        setMoveHistory([]);
        setViewIndex(-1);
        setWhiteTime(timeControl);
        setBlackTime(timeControl);
        setHasStarted(false);
    }

    function handleApplySettings(newTime: number) {
        setTimeControl(newTime);
        if (!hasStarted) {
            setWhiteTime(newTime);
            setBlackTime(newTime);
        }
        setActiveModal("none");
    }

    // Step navigation
    const goPrev = () => {
        if (viewIndex === -1) setViewIndex(moveHistory.length - 2);
        else if (viewIndex > -1) setViewIndex(viewIndex - 1);
    };

    const goNext = () => {
        if (viewIndex !== -1) {
            const nextIdx = viewIndex + 1;
            if (nextIdx >= moveHistory.length - 1) setViewIndex(-1);
            else setViewIndex(nextIdx);
        }
    };


    const isLive = viewIndex === -1;
    const isWhiteTurn = viewingGame.turn() === "w";
    const statusLabel = () => {
        if (viewingGame.isCheckmate()) return "CHECKMATE";
        if (viewingGame.isStalemate()) return "STALEMATE";
        if (viewingGame.isDraw()) return "DRAW";
        if (whiteTime === 0) return "BLACK WINS ON TIME";
        if (blackTime === 0) return "WHITE WINS ON TIME";
        if (viewingGame.isCheck()) return "CHECK!";
        return null;
    };
    const showNotice = statusLabel();

    return (
        <div style={{
            minHeight: "100dvh",
            background: "linear-gradient(135deg, #12100e 0%, #1c1610 40%, #12100e 100%)",
            color: "#e8dcc8",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            display: "flex", flexDirection: "column",
            overflow: "hidden"
        }}>
            {/* ── Top Bar ────────────────────────────────────────────────── */}
            <div style={{
                background: "linear-gradient(90deg, #1a1208, #3b2600, #1a1208)", borderBottom: "2px solid #5c3d00",
                padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setActiveModal("settings")} className="icon-btn" title="Settings">
                        <Settings size={18} color="#c89b3c" />
                    </button>
                    <button onClick={() => setActiveModal("load")} className="icon-btn" title="Load Matches">
                        <Database size={18} color="#c89b3c" />
                    </button>
                    <button onClick={saveMatch} className="icon-btn" title="Save Match">
                        <Save size={18} color="#c89b3c" />
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Swords size={18} color="#c89b3c" />
                    <span style={{ color: "#c89b3c", letterSpacing: "0.2em", fontSize: "clamp(10px, 1.5vw, 14px)", fontWeight: 700, textAlign: 'center' }}>
                        IMPERIAL CHESS
                    </span>
                    <Swords size={18} color="#c89b3c" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleReset} className="icon-btn danger" title="New Game">
                        <RotateCcw size={18} color="#f87171" />
                    </button>
                </div>
            </div>

            {/* ── Main Layout ────────────────────────────────────────────── */}
            <div className="chess-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* Board Area */}
                <main style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "20px", position: "relative"
                }}>
                    <div className="board-sizer" style={{ position: "relative", width: "min(calc(100dvh - 120px), calc(100% - 20px))", maxWidth: "min(calc(100dvh - 120px), 100%)", aspectRatio: "1 / 1" }}>

                        {/* Overlay for notices like Check/Checkmate */}
                        {showNotice && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                background: 'rgba(20, 10, 5, 0.85)', padding: '20px 40px', borderRadius: '12px',
                                border: '2px solid #c89b3c', zIndex: 50, backdropFilter: 'blur(4px)',
                                color: showNotice.includes('CHECKMATE') || showNotice.includes('WINS') ? '#ef4444' : '#c89b3c',
                                fontWeight: 'bold', fontSize: '2rem', letterSpacing: '0.1em', textAlign: 'center',
                                textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                pointerEvents: 'none'
                            }}>
                                {showNotice}
                            </div>
                        )}

                        {/* Historical notice */}
                        {!isLive && (
                            <div style={{
                                position: 'absolute', top: -25, right: 0,
                                color: '#6fa8dc', fontSize: 12, fontWeight: 'bold', letterSpacing: 1,
                                background: '#0e2040', padding: '2px 8px', borderRadius: 4, zIndex: 20
                            }}>
                                VIEWING HISTORY (Move {viewIndex + 1}/{moveHistory.length})
                            </div>
                        )}

                        {/* Board frame */}
                        <div style={{ position: "absolute", inset: -6, borderRadius: 10, border: "4px solid #5c3d00", boxShadow: "0 0 0 2px #2a1c00, 0 0 40px 8px rgba(92,61,0,0.3), inset 0 0 20px rgba(0,0,0,0.6)", pointerEvents: "none", zIndex: 10 }} />
                        <div style={{ position: "absolute", inset: -3, borderRadius: 8, border: "1px solid #8a6020", pointerEvents: "none", zIndex: 11 }} />

                        <Chessboard
                            options={{
                                position: viewingGame.fen(),
                                onPieceDrop: onDrop,
                                animationDurationInMs: 250,
                                darkSquareStyle: {
                                    backgroundColor: "#2a2218",
                                    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.7), inset 0 -1px 4px rgba(200,170,100,0.06)",
                                },
                                lightSquareStyle: {
                                    backgroundColor: "#9c8a6e",
                                    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.35), inset 0 -1px 4px rgba(255,255,255,0.12)",
                                },
                                boardStyle: {
                                    borderRadius: "4px",
                                    backgroundImage: "url('/battle_board.png')",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    width: "100%",
                                    height: "100%",
                                },
                                pieces: customPieces as any,
                            }}
                        />
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="chess-sidebar" style={{
                    background: "linear-gradient(160deg, #1a1208 0%, #231808 100%)",
                    borderLeft: "2px solid #3b2600",
                    display: "flex", flexDirection: "column", gap: 15,
                    padding: "20px", overflowY: "auto", flexShrink: 0
                }}>

                    {/* Factions & Timers */}
                    <FactionCard name="British Empire" subtitle="White / First" icon={<Crown size={16} />} active={isLive && isWhiteTurn && !isGameOver} accent="#c89b3c" shade="#3b2800" time={whiteTime} />
                    <FactionCard name="French Empire" subtitle="Black / Second" icon={<Shield size={16} />} active={isLive && !isWhiteTurn && !isGameOver} accent="#6fa8dc" shade="#0e2040" time={blackTime} />

                    {/* Controls (Undo & History Nav) */}
                    <div style={{ display: 'flex', background: '#12100e', borderRadius: 8, overflow: 'hidden', border: '1px solid #3b2600' }}>
                        <button onClick={() => setViewIndex(-2)} disabled={moveHistory.length === 0} className="hist-btn" title="Start">
                            <Rewind size={16} />
                        </button>
                        <button onClick={goPrev} disabled={moveHistory.length === 0 || viewIndex === -2} className="hist-btn" title="Previous">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={goNext} disabled={isLive} className="hist-btn" title="Next">
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={() => setViewIndex(-1)} disabled={isLive} className="hist-btn" title="Live">
                            <FastForward size={16} />
                        </button>
                    </div>

                    {/* Move History */}
                    <div style={{ flex: 1, background: "#12100e", border: "1px solid #2a1c00", borderRadius: 8, padding: "10px", display: "flex", flexDirection: "column", minHeight: 150 }}>
                        <div style={{ fontSize: 13, color: "#b8a070", borderBottom: '1px solid #2a1c00', paddingBottom: 6, marginBottom: 8, fontWeight: 'bold' }}>Moves Played</div>
                        <div style={{ flex: 1, overflowY: "auto", fontSize: 12, lineHeight: 1.8 }} className="custom-scrollbar">
                            {moveHistory.length === 0 ? <div style={{ color: '#5a4020', fontStyle: 'italic', textAlign: 'center', marginTop: '20%' }}>No moves yet</div> : null}
                            {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                                const whiteMove = moveHistory[i * 2];
                                const blackMove = moveHistory[i * 2 + 1];
                                const highlightRow = viewIndex >= i * 2 && viewIndex <= i * 2 + 1;
                                return (
                                    <div key={i} style={{ display: 'flex', padding: '2px 6px', background: highlightRow ? '#2a1c00' : 'transparent', borderRadius: 4 }}>
                                        <span style={{ color: "#5a4020", width: 24 }}>{i + 1}.</span>
                                        <span style={{ color: viewIndex === i * 2 ? "#fff" : "#c89b3c", flex: 1, cursor: 'pointer', fontWeight: viewIndex === i * 2 ? 'bold' : 'normal' }} onClick={() => setViewIndex(i * 2)}>{whiteMove}</span>
                                        {blackMove && (
                                            <span style={{ color: viewIndex === i * 2 + 1 ? "#fff" : "#6fa8dc", flex: 1, cursor: 'pointer', fontWeight: viewIndex === i * 2 + 1 ? 'bold' : 'normal' }} onClick={() => setViewIndex(i * 2 + 1)}>
                                                {blackMove}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            {activeModal !== "none" && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#1a1208', border: '2px solid #5c3d00', borderRadius: 12,
                        width: '90%', maxWidth: 400, padding: 24, position: 'relative'
                    }}>
                        <button onClick={() => setActiveModal("none")} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: '#c89b3c', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        {activeModal === "settings" && (
                            <div>
                                <h3 style={{ color: '#c89b3c', marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Settings size={20} /> Game Settings</h3>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', color: '#b8a070', fontSize: 13, marginBottom: 8 }}>Time Control</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {[3, 5, 10, 30].map(mins => (
                                            <button
                                                key={mins}
                                                onClick={() => handleApplySettings(mins * 60)}
                                                style={{
                                                    flex: 1, padding: "10px 0", borderRadius: 6, border: `1px solid ${timeControl === mins * 60 ? '#c89b3c' : '#3b2600'}`,
                                                    background: timeControl === mins * 60 ? '#3b2600' : '#12100e', color: timeControl === mins * 60 ? '#fff' : '#b8a070',
                                                    cursor: 'pointer', fontWeight: timeControl === mins * 60 ? 'bold' : 'normal'
                                                }}
                                            >{mins} min</button>
                                        ))}
                                    </div>
                                    {hasStarted && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 8 }}>Changing time during active game will reset timers for next game.</p>}
                                </div>
                            </div>
                        )}

                        {activeModal === "load" && (
                            <div>
                                <h3 style={{ color: '#c89b3c', marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Database size={20} /> Saved Matches</h3>
                                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {savedMatches.length === 0 ? <p style={{ color: '#5a4020', textAlign: 'center' }}>No saved matches found.</p> : null}
                                    {savedMatches.map(m => (
                                        <div key={m.id} style={{
                                            background: '#12100e', border: '1px solid #3b2600', borderRadius: 8, padding: 12,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ color: '#e8dcc8', fontSize: 14, fontWeight: 'bold' }}>{m.result}</div>
                                                <div style={{ color: '#7a6040', fontSize: 11 }}>{m.date}</div>
                                            </div>
                                            <button onClick={() => loadMatch(m.pgn)} style={{
                                                background: '#2c2010', color: '#c89b3c', border: '1px solid #5c3d00', borderRadius: 6,
                                                padding: '6px 12px', cursor: 'pointer', fontSize: 12
                                            }}>Load</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── CSS ───────────────────────────────────────────────────────── */}
            <style>{`
                html, body, #root { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                .chess-layout { flex-direction: row !important; }
                .chess-sidebar { width: 300px !important; }
                
                .icon-btn {
                    background: #2a1c00; border: 1px solid #5c3d00; border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: 0.2s;
                }
                .icon-btn:hover { background: #3b2800; }
                .icon-btn.danger { background: #2a0e0e; border-color: #6b1c1c; }
                .icon-btn.danger:hover { background: #3b1414; }

                .hist-btn {
                    flex: 1; background: transparent; border: none; border-right: 1px solid #3b2600; padding: 8px 0;
                    color: #b8a070; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;
                }
                .hist-btn:last-child { border-right: none; }
                .hist-btn:hover:not(:disabled) { background: #2a1c00; color: #c89b3c; }
                .hist-btn:disabled { opacity: 0.4; cursor: not-allowed; }

                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b2600; border-radius: 4px; }

                @media (max-width: 768px) {
                    .chess-layout { flex-direction: column !important; overflow-y: auto !important; }
                    .chess-sidebar { width: 100% !important; border-left: none !important; border-top: 2px solid #3b2600 !important; }
                    .board-sizer { width: min(90vw, 400px) !important; max-width: 100% !important; }
                }
            `}</style>
        </div>
    );
}

function FactionCard({ name, subtitle, icon, active, accent, shade, time }: any) {
    return (
        <div style={{
            background: active ? `linear-gradient(135deg, ${shade}, #1a1208)` : "#18140c",
            border: `1px solid ${active ? accent : "#2a1c00"}`,
            borderRadius: 10, padding: "12px", display: "flex", alignItems: "center", gap: 12,
            transition: "all 0.3s", boxShadow: active ? `0 0 15px ${accent}44` : "none",
        }}>
            <span style={{ color: active ? accent : "#4a3820" }}>{icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{ color: active ? accent : "#6a5030", fontWeight: 700, fontSize: 14 }}>{name}</div>
                <div style={{ color: "#5a4020", fontSize: 11 }}>{subtitle}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#12100e', padding: '4px 10px', borderRadius: 6, border: '1px solid #2a1c00' }}>
                <Clock size={12} color={active ? accent : '#5a4020'} />
                <span style={{ color: active ? '#fff' : '#b8a070', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {formatTime(time)}
                </span>
            </div>
        </div>
    );
}
