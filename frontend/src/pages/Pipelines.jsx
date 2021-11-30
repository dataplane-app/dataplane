import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faSearch, faChartBar, faCaretDown } from '@fortawesome/free-solid-svg-icons'
import Pills from '../components/Pills';

const Pipelines = () => {
    return (
        <div className="pipelines">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-22">Pipelines</h2>
                <FontAwesomeIcon icon={faEllipsisV} className="cursor-pointer text-halfBlack text-22"/>
            </div>

            <div className="mt-10 flex items-center">
                <Pills amount={2} text="Pipelines" color="orange" />
                <Pills amount={2} text="Succeeded" color="green" />
                <Pills amount={2} text="Failed" color="red" />
                <Pills amount={2} text="Workers online" color="purple" />

                <div className="border border-gray rounded-lg pl-3 w-60 flex items-center">
                    <FontAwesomeIcon icon={faSearch} className="text-halfBlack text-xs" />
                    <input type="text" placeholder="Find a pipeline" className="py-3 pl-3 pr-4 outline-none text-xs flex-1"/>
                </div>

                <div className="border border-gray ml-4 p-3 rounded-lg flex items-center cursor-pointer hover:bg-gray-100">
                    <FontAwesomeIcon icon={faChartBar} className="text-halfBlack text-xs"/>
                    <p className="flex-1 mx-2 text-xs">Last 48 Hours</p>
                    <FontAwesomeIcon icon={faCaretDown} className="text-halfBlack text-base"/>
                </div>

            </div>
        </div>
    )
}

export default Pipelines;