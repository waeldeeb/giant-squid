import {React, useEffect, useState} from 'react';
import './App.css';
import {DataSource} from './constants/index';

const wonBoards = new Set();

const App = () => {
    const [drawNumbersData, setDrawNumbersData] = useState<number[]>([]);
    const [boardsData, setBoardsData] = useState<Map<string, number[][]>>(new Map());
    const [drawNumbersCall, setDrawNumbersCall] = useState<number[]>([]);
    const [timerRunning, setTimerRunning] = useState<boolean>(false);
    const [selectedDataSource, setSelectedDataSource] = useState(DataSource.TestCodeData);
    const [lastBoardWinnerMessage, setLastBoardWinnerMessage] = useState<string>('');

    useEffect(() => {
        checkLastBoardWinner()
    }, [drawNumbersCall])

    useEffect(() => {
        parseRawData()
    }, [selectedDataSource])


    useEffect(() => {
        let timer: number | undefined;
        if (timerRunning) {
            timer = setInterval(() => {
                if (drawNumbersData.length > 0) {
                    const nextNumber = drawNumbersData[0];
                    setDrawNumbersData((prevUpcomingNumbers) => prevUpcomingNumbers.slice(1));
                    setDrawNumbersCall((prevInputNumbers) => [...prevInputNumbers, nextNumber]);
                }
            }, 50);
        }

        return () => clearInterval(timer);
    }, [drawNumbersData, timerRunning]);

    // Parsing raw data
    const parseRawData = () => {
        const lines = selectedDataSource.trim().split('\n\n');
        let drawNumbers = lines[0].split(',').map(Number);
        let boardMap = new Map<string, number[][]>();

        const boardData = lines.slice(1);

        for (let i = 0; i < boardData.length; i++) {
            boardMap.set(`${i + 1}`, parseBoardRow(boardData[i]));
        }
        setDrawNumbersData(drawNumbers);
        setBoardsData(boardMap);
    }

    // Parsing helper for each row in the board
    function parseBoardRow(row: string) {
        let rows = row.split('\n');
        return rows.map(row =>
            row.split(' ').filter(row => row !== '').map(Number))
    }

    enum DataSourceEnums {
        TestData = 'TestCodeData',
        RealData = 'RealInputData'
    }

    const handleDataSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        clearData()
        const selectedValue = event.target.value;
        if (selectedValue === DataSourceEnums.TestData) {
            setSelectedDataSource(DataSource.TestCodeData)
        } else {
            setSelectedDataSource(DataSource.RealInputData)
        }
    }

    // Clearing data when changing from Test data into Real data
    const clearData = () => {
        setDrawNumbersData([])
        setDrawNumbersCall([])
        setBoardsData(new Map())
        wonBoards.clear()
        setLastBoardWinnerMessage('')
    }


    const handleStartStopTimer = () => {
        setTimerRunning((prevTimerRunning) => !prevTimerRunning);
    };

    // Return status if the board has completed row or column
    const checkBoardCompletion = (board: number[][], drawingNumbers: number[]) => {
        for (const line of board) {
            for (let colIndex = 0; colIndex < board[0].length; colIndex++) {
                if (line.every((number) => drawingNumbers.includes(number))
                    || board.every((line) => drawingNumbers.includes(line[colIndex]))) {
                    return true;
                }
            }
        }
        return false;
    };


    const checkLastBoardWinner = () => {
        let lastBoardWon = '';
        let result = 0;

        for (let [key, value] of boardsData) {
            if (checkBoardCompletion(value, drawNumbersCall) && !wonBoards.has(key)) {
                wonBoards.add(key);
                lastBoardWon = key;
            }
            if (drawNumbersData.length === 0 || wonBoards.size === boardsData.size) {
                setTimerRunning(false);
                const lastDrawNumberCall = drawNumbersCall[drawNumbersCall.length - 1];
                const lastBoardData = boardsData.get(lastBoardWon);

                if (lastBoardData) {
                    const unMarkedNumbers = lastBoardData.flat().filter(number => !drawNumbersCall.includes(number));
                    const sum = unMarkedNumbers.reduce((sum, num) => sum + num, 0);
                    result = sum * lastDrawNumberCall;
                }
                setLastBoardWinnerMessage(`Last won board is "Board ${lastBoardWon}" and the score is ${result}`);
                break;
            }
        }

    };

    // Boards container
    const BoardsContainer = () => {
        return (
            <div className="App">
                <h2>Boards List</h2>
                {lastBoardWinnerMessage ? lastBoardWinnerMessage : null}
                <div className="board-container">
                    {Array.from(boardsData).map(([key, value]) => (
                        <Board key={key} lines={value} drawingNumbers={drawNumbersCall} boardNumber={key}/>
                    ))}
                </div>
            </div>
        )
    }

    // Slot component
    interface SlotProps {
        number: number;
        isHighlighted: boolean;
    }

    const Slot = ({number, isHighlighted}: SlotProps) => {
        return (
            <div className={`slot ${isHighlighted && 'highlighted'}`}>
                {number !== null ? number : null}
            </div>
        );
    };

    // Board component
    interface BoardProps {
        lines: number[][];
        drawingNumbers: number[];
        boardNumber: string
    }

    const Board = ({lines, drawingNumbers, boardNumber}: BoardProps) => {
        const [hasCompletedRowOrColumn, setHasCompletedRowOrColumn] = useState<boolean>(false);

        useEffect(() => {
            if (checkBoardCompletion(lines, drawingNumbers)) {
                setHasCompletedRowOrColumn(true);
            }
        }, [drawingNumbers]);

        return (
            <div>
                <h3>{'Board: ' + boardNumber}</h3>
                <div className={`board ${hasCompletedRowOrColumn ? 'boardHighlight' : ''}`}>
                    {lines.map((line, rowIndex) => (
                        <div key={rowIndex} className="board-row">
                            {line.map((number, index) => (
                                <Slot key={index} number={number} isHighlighted={drawingNumbers.includes(number)}/>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <div>
                <h1>Bingo for giant Squid</h1>
                <select className="select" onChange={handleDataSelection}>
                    {Object.values(DataSourceEnums).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <button onClick={handleStartStopTimer}>
                    {timerRunning ? 'Stop' : 'Start'}
                </button>
                <div className="numbers-container">
                    <h2>The upcoming numbers</h2>
                    <p>{drawNumbersData.join(', ')}</p>
                    <h2>Called numbers</h2>
                    <p>{drawNumbersCall.join(', ')}</p>
                </div>
                <BoardsContainer/>
            </div>
        </>
    )
}

export default App
