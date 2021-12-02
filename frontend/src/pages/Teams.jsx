import { useMemo } from 'react';
import Pills from "../components/Pills";
import Search from "../components/Search";
import { useTable, useGlobalFilter } from "react-table";
import { useEffect } from 'react';

// function Table({ columns, data }) {
//     // Render the UI for your table
//     return (
//         <table {...getTableProps()} className="w-full mt-8">
//             <thead>
//                 {headerGroups.map((headerGroup) => (
//                     <tr {...headerGroup.getHeaderGroupProps()} className="grid grid-cols-teams">
//                         {headerGroup.headers.map((column) => (
//                             <th {...column.getHeaderProps()}>
//                                 {column.render("Header")}
//                             </th>
//                         ))}
//                     </tr>
//                 ))}
//             </thead>
//             <tbody {...getTableBodyProps()} className="flex flex-col">
//                 {rows.map((row, i) => {
//                     prepareRow(row);
//                     return (
//                         <tr {...row.getRowProps()} className="grid grid-cols-teams border border-gray rounded-md py-4 mt-3">
//                             {row.cells.map((cell) => {
//                                 console.log(cell.column)
//                                 return (
//                                     <td {...cell.getCellProps()} className="text-center">
//                                         {cell.render("Cell")}
//                                     </td>
//                                 );
//                             })}
//                         </tr>
//                     );
//                 })}
//             </tbody>
//         </table>
//     );
// }

const Teams = () => {
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
                Cell: row => <Pills text={row.value} color="green" />
            },
            {
                Header: "Permissions",
                accessor: "permissions"
            },
            {
                Header: "Status",
                accessor: "status"
            },
            {
                Header: "Manage",
                accessor: "manage"
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
            <h2 className="font-bold text-22">Teams</h2>

            <div className="mt-10 lg:w-4/5">
                <div className="flex items-center justify-start">
                    <Pills amount={2} text="Members" color="orange" />
                    <div className="inline-block w-60">
                        <Search placeholder="Find members" value={globalFilter} onChange={setGlobalFilter} />
                    </div>
                </div>

                <table {...getTableProps()} className="w-full mt-8">
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()} className="grid grid-cols-teams">
                                {headerGroup.headers.map((column) => (
                                    <th {...column.getHeaderProps()}>
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
                    </table >
            </div>

        </div>
    );
};

const CustomMember = ({ row }) => {
    return (
        <div>
            <h4 className="text-blue font-black text-lg">{row.value.name}</h4>
            <h5 className="text-xs" >{row.value.occupation}</h5>
        </div>
    )
}

const CustomEmail = ({ row }) => {
    return (
        <div>
            <h4 className="text-sm mb-2">{row.value.email}</h4>
            <Pills text={row.value.role} color="orange" className="text-sm" />
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
        status: "active",
        manage: ""
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
        status: "active",
        manage: ""
    },
]

export default Teams;
