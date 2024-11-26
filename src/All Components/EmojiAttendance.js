import React, { useEffect, useState } from "react";
import { Typography, ListItem, Tooltip, Switch, Button, Card } from "@material-tailwind/react";
import { FaCheckCircle, FaHome, FaHospitalUser, FaUmbrellaBeach, FaQuestionCircle, FaUserClock, FaIdCard  } from 'react-icons/fa';
import { GiMoneyStack, GiWitchFlight } from 'react-icons/gi';
import { IoIosArrowForward } from "react-icons/io";
import { MdPunchClock, MdSick } from 'react-icons/md';
import { LuPalmtree } from 'react-icons/lu';
import useSWR from 'swr';
import config from "../config.js";

const customColor = '#000000';

const attendanceTypeDetails = [
    {
        type: 'Present',
        icon: <FaCheckCircle style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Fully attended work',
        shortCode: '[P]',
        textColor: 'text-green-500'
    },
    {
        type: 'LOP',
        icon: <GiMoneyStack style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Loss of pay',
        shortCode: '[LOP]',
        textColor: 'text-red-500'
    },
    {
        type: 'Half day',
        icon: <FaUserClock style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Half-day work',
        shortCode: '[HD]',
        textColor: 'text-red-500'
    },
    {
        type: 'Half day late login',
        icon: <MdPunchClock style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Half Day Logged in late',
        shortCode: '[HDLL]',
        textColor: 'text-red-500'
    },
    {
        type: 'WFH',
        icon: <FaHome style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Work from home',
        shortCode: '[WFH]',
        textColor: 'text-red-500'
    },
    {
        type: 'Emergency leave',
        icon: <FaHospitalUser style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Leave due to emergency',
        shortCode: '[EL]',
        textColor: 'text-orange-500'
    },
    {
        type: 'Casual leave',
        icon: <LuPalmtree style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Casual leave',
        shortCode: '[CL]',
        textColor: 'text-orange-500'
    },
    {
        type: 'Sick leave',
        icon: <MdSick style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Sick leave',
        shortCode: '[SL]',
        textColor: 'text-orange-500'
    },
    {
        type: 'Week off',
        icon: <FaUmbrellaBeach style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Weekly off',
        shortCode: '[WO]',
        textColor: 'text-green-500'
    },
    {
        type: 'Abscond',
        icon: <FaQuestionCircle style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Unclear status',
        shortCode: '[ABS]',
        textColor: 'text-red-500'
    },
    {
        type: 'Holiday',
        icon: <GiWitchFlight style={{ color: customColor, fontSize: '1.2rem' }} />,
        description: 'Holiday',
        shortCode: '[HOL]',
        textColor: 'text-orange-500'
    }
];

const EmojiAttendance = () => {
    const [isVisible, setIsVisible] = useState(true); // State to control visibility
    const [attendanceData, setAttendanceData] = useState([]);
    const [monthlyCounts, setMonthlyCounts] = useState({});
    const [selectedMonth, setSelectedMonth] = useState('');
    const storedEmployeeId = localStorage.getItem('employeeId');

    const token = localStorage.getItem("Access Token");
    const fetcher = (url) =>
        fetch(url, {
            headers: {
                Authorization: token,
            },
        }).then((res) => res.json());
    const { data, error } = useSWR(`${config.hostedUrl}/attendanceDetails/attendance`, fetcher, {
        refreshInterval: 4000,
        onSuccess: (fetchedData) => {
            localStorage.setItem('attendanceData', JSON.stringify(fetchedData));
        }
    });

    const SkeletonItem = () => (
        <div className="flex items-center gap-3 rounded-lg py-2 animate-pulse">
            <div className="flex items-center justify-center rounded-lg bg-gray-300 p-3">
                <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
        </div>
    );

    // Filter data based on storedEmployeeId
    useEffect(() => {
        try {
            const storedData = localStorage.getItem('attendanceData');
            if (storedData) {
                let parsedData;
                try {
                    parsedData = JSON.parse(storedData);
                } catch (e) {
                    console.error("Error parsing localStorage data:", e);
                    parsedData = []; // Default to empty array if parsing fails
                }

                // Ensure parsedData is an array or convert it to an array if it's an object
                if (!Array.isArray(parsedData)) {
                    parsedData = Object.values(parsedData); // Convert non-array object to array
                }

                // Filter data based on storedEmployeeId
                const filteredData = storedEmployeeId
                    ? parsedData.filter((item) => item.Employee_Id === storedEmployeeId)
                    : parsedData;


                // Create a flat array from the attendance data
                const attendanceEntries = [];
                filteredData.forEach((entry) => {
                    const { Employee_Id, Name, ...dates } = entry; // Destructure to separate dates
                    Object.entries(dates).forEach(([date, status]) => {
                        attendanceEntries.push({ Employee_Id, Name, date, status });
                    });
                });
                setAttendanceData(attendanceEntries);

                // Count attendance types by month
                const counts = {};
                attendanceEntries.forEach((entry) => {
                    const [day, month, year] = entry.date.split('/').map(Number);
                    const date = new Date(year, month - 1, day); // Month is zero-indexed
                    const monthYear = date.toLocaleString('default', { month: 'long' }) + ' ' + year;
                    const attendanceType = entry.status;

                    if (!counts[monthYear]) {
                        counts[monthYear] = {
                            "LOP": 0,
                            "Present": 0,
                            "Week off": 0,
                            "Sick leave": 0,
                            "WFH": 0,
                            "Emergency leave": 0,
                            "Abscond": 0,
                            "Half day": 0,
                            "Casual leave": 0,
                            "Half day late login": 0,
                            "Holiday": 0,
                        };
                    }

                    if (attendanceType && counts[monthYear][attendanceType] !== undefined) {
                        counts[monthYear][attendanceType]++;
                    }
                });

                setMonthlyCounts(counts);
            } else {
                throw new Error('No attendance data found in localStorage.');
            }
        } catch (err) {
            console.error('Error in useEffect:', err.message);
        }
    }, [data, storedEmployeeId]);

    if (error) return <div>Error loading attendance data</div>;

    // Create an array of month-year options from the monthlyCounts
    const monthOptions = Object.keys(monthlyCounts);

    const today = new Date();
    const todayDate = today.getDate() + ' ' + today.toLocaleString('default', { month: 'short' });
    const todayDay = today.toLocaleString('default', { weekday: 'long' });

    const toggleVisibility = () => {
        setIsVisible(prev => !prev);
    };

    return (
        <div className="w-full px-4">
            <div className="flex justify-between p-3 mb-3 bg-blue-gray-50 rounded-border">
                {/* Left Section */}
                <div className="w-1/2">
                    <div className="mb-1 flex items-center gap-3">
                        <Typography
                            variant="md"
                            color="blue-gray"
                            className="font-bold transition-colors hover:text-gray-900"
                        >Attendance Overview:
                        </Typography>
                        <Tooltip
                            placement="bottom"
                            className="inline-flex border border-blue-gray-50 bg-black text-white px-4 py-3 shadow-xl shadow-black/10"
                            content={
                                <div className="w-80">
                                    <Typography
                                        variant="medium"
                                        color="white"
                                        className="font-normal opacity-80"
                                    >
                                        Please connect with HR for any issues 🙂
                                    </Typography>
                                </div>
                            }
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-5 w-5 cursor-pointer text-blue-gray-500 inline"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                                />
                            </svg>
                        </Tooltip>
                    </div>
                    <Typography
                        variant="sm"
                        color="gray"
                        className="font-normal text-blue-gray-500"
                    >Attendance details are listed in the tab. For corrections, please contact HR.
                    </Typography>
                    <div className="m-1 flex items-center gap-5">
                        <div className="flex items-center gap-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="-mt-px h-4 w-4 text-green-500"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <Typography
                                color="gray"
                                className="text-xs font-medium text-blue-gray-500"
                            >
                                Verified from HR
                            </Typography>
                        </div>
                    </div>
                </div>
                {/* Right Section */}
                <div className="w-1/2 flex justify-end">
                    <Card className="w-3/5 rounded-lg border border-gray-300 py-2 px-3">
                    <Typography className="mb-1 text-gray-600 text-xs font-normal">GENERAL SHIFT (11:30 AM - 08:30 PM)</Typography>
                        <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white border border-gray-400 p-1.5 rounded-lg">
                                    <FaIdCard className="h-6 w-6 text-black" />
                                </div>
                                <div className="flex">
                                    <Typography variant="medium" color="blue-gray" className="font-bold">
                                        {todayDate}
                                    </Typography>
                                    <Typography variant="medium" color="gray" className="font-bold pl-2">
                                        {todayDay}
                                    </Typography>
                                </div>
                                <div>
                                    <IoIosArrowForward/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex gap-1">
                                <Typography className="mb-1 text-sm !font-medium !text-gray-600">
                                    Worked for:
                                </Typography>
                                <Typography className="text-sm !font-bold" color="blue-gray">
                                    0 / 8 Hrs
                                </Typography>
                            </div>
                        </div>
                        <Button className="bg-green-700">Clock In</Button>
                    </Card>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Typography variant="md" color="blue-gray" className="whitespace-nowrap">
                    Select Month:
                </Typography>
                <select
                    id="month-select"
                    className="block w-auto max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-gray-900 focus:ring focus:ring-gray-900/10 sm:text-md"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="">Please choose a month</option>
                    {monthOptions.map((monthYear) => (
                        <option key={monthYear} value={monthYear}>
                            {monthYear}
                        </option>
                    ))}
                </select>
            </div>
            <hr className="my-2 border-black-gray-50" />
            <div className="mt-2">
                <div className="flex justify-end">
                    <Switch color="blue-gray" label={
                        <div className="flex items-center gap-2">
                            <Typography className="font-medium text-black">
                                {isVisible ? 'Hide' : 'Show'} Details
                            </Typography>
                        </div>
                    }
                        className={`${isVisible ? 'bg-black' : 'bg-gray-500'}`}
                        onChange={toggleVisibility}
                        checked={isVisible}
                    />
                </div>
                {isVisible && (
                    <div>
                        <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 transition-opacity duration-300 ${isVisible ? '' : 'opacity-50 blur-sm'}`}>
                            {!attendanceData.length
                                ? Array.from({ length: 4 }).map((_, index) => (
                                    <SkeletonItem key={index} />
                                ))
                                : attendanceTypeDetails.map(({ type, icon, description, shortCode, textColor }) => (
                                    <ListItem key={type} className="flex items-center gap-3 rounded-lg py-2 hover:bg-blue-gray-50">
                                        <div className="flex items-center justify-center rounded-lg bg-blue-gray-50 p-3">
                                            {icon}
                                        </div>
                                        <div className="flex-1">
                                            <Typography variant="text" color="blue-gray" className="text-sm font-bold">
                                                {type}:
                                                <span className="ml-2 text-blue-gray-900 font-bold text-base">
                                                    {monthlyCounts?.[selectedMonth]?.[type] || 0}
                                                </span>
                                            </Typography>
                                            <Typography variant="text" className="text-xs font-medium text-blue-gray-500">
                                                {description} <span className={`font-bold ${textColor}`}>{shortCode}</span>
                                            </Typography>
                                        </div>
                                    </ListItem>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmojiAttendance;
