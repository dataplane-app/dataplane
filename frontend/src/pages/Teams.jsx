import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { useMemo } from 'react';
import Pills from "../components/Pills";
import Search from "../components/Search";
import { useTable, useGlobalFilter } from "react-table";
import { useEffect } from 'react';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

const Teams = () => {
    let navigate = useNavigate();

    const columns = useMemo(
        () => [
            {
                Header: "Member",
                accessor: "member",
                // sortable: true,
                // maxWidth: '600px',
                Cell: row => <CustomMember row={row} />,
            },
            {
                Header: "Email",
                accessor: "email",
                Cell: row => <CustomEmail row={row} />,
            },
            {
                Header: "Role",
                accessor: "role",
                Cell: row => <p className="text-xs dark:text-white">{row.value}</p>
            },
            {
                Header: "Permissions",
                accessor: "permissions",
                Cell: row => <p className="text-xs dark:text-white">{row.value}</p>
            },
            {
                Header: "Status",
                accessor: "status",
                Cell: row => <Pills color="green" text={row.value} size="small" />
            },
            {
                Header: "Manage",
                accessor: "manage",
                Cell: row => <FontAwesomeIcon icon={faEllipsisV} onClick={() => navigate(`/teams/${row.value.id}`)} className="cursor-pointer text-halfBlack dark:text-white text-22"/>
            },
        ],
        []
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, setGlobalFilter } =
        useTable({
            columns,
            data,
        }, useGlobalFilter);

    const { globalFilter } = state;

    useEffect(() => {
        console.log(globalFilter)
    }, [globalFilter])

    return (
        <div className="teams">
            <h2 className="font-bold text-22 dark:text-white">Team</h2>

            <div className="mt-8 lg:w-4/5">
                <div className="flex items-center justify-between">
                    <div>
                        <Pills amount={2} text="Members" color="orange" margin="4" />
                        <div className="inline-block w-60">
                            <Search placeholder="Find members" value={globalFilter} onChange={setGlobalFilter} />
                        </div>
                    </div>
                    <div className="flex">
                        <Button text="Add" classes="w-40"/>
                    </div>
                </div>

                <table {...getTableProps()} className="w-full mt-8">
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()} className="grid grid-cols-teams justify-start">
                                {headerGroup.headers.map((column) => (
                                    <th {...column.getHeaderProps()} className="dark:text-white">
                                        {column.render("Header")}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()} className="flex flex-col">
                        {rows.map((row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()} className="grid grid-cols-teams border border-gray rounded-md py-4 mt-3">
                                    {row.cells.map((cell) => {
                                        return (
                                            <td {...cell.getCellProps()} className="text-center">
                                                {cell.render("Cell")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
            </div>

        </div>
    );
};

const CustomMember = ({ row }) => {
    return (
        <div>
            <h4 className="text-blue font-black text-lg ">{row.value.name}</h4>
            <h5 className="text-xs dark:text-white" >{row.value.occupation}</h5>
        </div>
    )
}

const CustomEmail = ({ row }) => {
    return (
        <div className="flex items-center justify-start flex-col">
            <h4 className="text-sm mb-2 dark:text-white">{row.value.email}</h4>
                <Pills text={row.value.role} color="orange" size="small" />
        </div>
    )
}

const data = [
    {
        id: 1,
        member: {
            name: "Saul Frank",
            occupation: "Data Engineer"
        },
        email: {
            email: "saulfrank@email.com",
            role: "Admin"
        },
        role: "Admin",
        permissions: "Admin",
        status: "Active",
        manage: {
            id: 1
        }
    },
    {
        id: 2,
        member: {
            name: "Nicolas Marqui",
            occupation: "Software Engineer"
        },
        email: {
            email: "saulfrank@email.com",
            role: "Admin"
        },
        role: "Admin",
        permissions: "Admin",
        status: "Active",
        manage: {
            id: 2
        }
    },
]

export default Teams;
