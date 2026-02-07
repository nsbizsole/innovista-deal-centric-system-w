import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatDate, getStatusClass } from '../lib/utils';

const GanttChart = ({ projectId, tasks }) => {
    const ganttData = useMemo(() => {
        if (!tasks || tasks.length === 0) return { tasks: [], minDate: new Date(), maxDate: new Date(), totalDays: 30 };

        const dates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.end_date)]);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

        return { tasks, minDate, maxDate, totalDays: Math.max(totalDays, 30) };
    }, [tasks]);

    const getBarStyle = (task) => {
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);
        const startOffset = Math.ceil((start - ganttData.minDate) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        const leftPercent = (startOffset / ganttData.totalDays) * 100;
        const widthPercent = (duration / ganttData.totalDays) * 100;

        return {
            left: `${Math.max(0, leftPercent)}%`,
            width: `${Math.min(widthPercent, 100 - leftPercent)}%`
        };
    };

    const generateDateHeaders = () => {
        const headers = [];
        const currentDate = new Date(ganttData.minDate);
        const interval = Math.ceil(ganttData.totalDays / 10);
        
        for (let i = 0; i <= 10; i++) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() + (i * interval));
            headers.push(date);
        }
        return headers;
    };

    if (tasks.length === 0) {
        return (
            <Card data-testid="gantt-chart">
                <CardHeader>
                    <CardTitle className="font-heading">Gantt Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        No tasks to display. Add tasks to see the Gantt chart.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card data-testid="gantt-chart">
            <CardHeader>
                <CardTitle className="font-heading">Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Date Headers */}
                <div className="flex border-b border-gray-200 pb-2 mb-4">
                    <div className="w-48 flex-shrink-0"></div>
                    <div className="flex-1 flex justify-between px-2">
                        {generateDateHeaders().map((date, i) => (
                            <span key={i} className="text-xs text-gray-500 font-mono">
                                {formatDate(date).split(',')[0]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Task Bars */}
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex items-center group" data-testid={`gantt-task-${task.id}`}>
                            {/* Task Name */}
                            <div className="w-48 flex-shrink-0 pr-4">
                                <div className="flex items-center gap-2">
                                    {task.is_milestone && (
                                        <div className="w-3 h-3 bg-red-500 rotate-45 flex-shrink-0"></div>
                                    )}
                                    <span className="text-sm font-medium truncate">{task.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{task.progress}%</span>
                            </div>

                            {/* Bar Container */}
                            <div className="flex-1 h-8 bg-gray-100 rounded relative">
                                {/* Progress Bar */}
                                <div
                                    className="absolute h-full bg-red-500 rounded transition-all duration-300 group-hover:shadow-glow"
                                    style={getBarStyle(task)}
                                >
                                    {/* Progress Fill */}
                                    <div
                                        className="h-full bg-red-700 rounded-l"
                                        style={{ width: `${task.progress}%` }}
                                    ></div>
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white bg-gray-900/80 px-2 py-1 rounded">
                                        {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                    </span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="w-24 flex-shrink-0 pl-4">
                                <Badge className={`${getStatusClass(task.status)} text-xs`}>
                                    {task.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm text-gray-600">Planned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-700 rounded"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rotate-45"></div>
                        <span className="text-sm text-gray-600">Milestone</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GanttChart;
