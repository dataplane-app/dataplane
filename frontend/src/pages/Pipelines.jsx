import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faChartBar, faCaretDown, faClock, faPlayCircle, faUndoAlt } from '@fortawesome/free-solid-svg-icons'
import Pills from '../components/Pills';
import pipelineMockData from '../utils/pipelineMockData';
import Search from '../components/Search';

const Pipelines = () => {
    return (
        <div className="pipelines">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-22 dark:text-white">Pipelines</h2>
                <FontAwesomeIcon icon={faEllipsisV} className="cursor-pointer text-halfBlack text-22"/>
            </div>

            <div className="mt-8 flex flex-col lg:flex-row items-center justify-start lg:w-4/5">
                <div className="flex items-center self-stretch lg:self-center">
                    <Pills amount={2} text="Pipelines" color="orange" margin="4" />
                    <Pills amount={2} text="Succeeded" color="green" margin="4"/>
                    <Pills amount={2} text="Failed" color="red" margin="4" />
                    <Pills amount={2} text="Workers online" color="purple"/>
                </div>

                <div className="flex-1 flex items-center self-stretch lg:self-center mt-3 lg:mt-0">
                    <Search placeholder="Find a pipeline" classes="ml-0 lg:ml-3" />

                    <div className="border border-gray dark:border-darkGray ml-4 p-3 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 flex-1">
                        <FontAwesomeIcon icon={faChartBar} className="text-halfBlack dark:text-white text-xs"/>
                        <p className="flex-1 mx-2 text-xs dark:text-white">Last 48 Hours</p>
                        <FontAwesomeIcon icon={faCaretDown} className="text-halfBlack dark:text-white text-base"/>
                    </div>
                </div>

            </div>

            <div className="mt-7 lg:w-4/5">
                {pipelineMockData.map(mock => (
                    <div className="mt-3 border border-gray rounded-md px-7 py-4 hover:bg-gray-50 cursor-pointer" key={mock.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-blue text-lg">{mock.title}</h3>
                                <p className="text-xs">{mock.description}</p>
                            </div>

                            <div className="flex items-center">
                                <span className={`h-4 w-4 rounded-full ${mock.manage === 'Online' ? 'bg-green' : 'bg-red'}`}></span>
                                <p className={`ml-2 text-base ${mock.manage === 'Online' ? 'text-green' : 'text-red'}`}>{mock.manage}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 lg:grid-cols-pipeline mt-5">
                            <div className="flex-1 flex items-center">
                                <FontAwesomeIcon icon={faClock} className="text-orange text-lg" />
                                <div className="ml-3">
                                    <p className="text-sm">Every 5 minutes</p>
                                    <p className="text-sm">*/5****</p>
                                </div>
                            </div>

                            <div className="flex-1 text-center">
                                <p className="text-sm">27 Nov 2021</p>
                                <p className="text-sm">22:05</p>
                            </div>

                            <div className="flex-1 text-center">
                                <p className="text-sm">27 Nov 2021</p>
                                <p className="text-sm">22:00 {`(1 min, 30s)`}</p>
                            </div>

                            <div className="flex-1 text-center">
                                <FontAwesomeIcon icon={faPlayCircle} className="cursor-pointer text-blue text-22 mr-2"/>
                                <FontAwesomeIcon icon={faUndoAlt} className="cursor-pointer text-blue text-22 rotate-180    "/>
                            </div>

                            <div className="flex-1 text-center">
                                {mock.status === 'Running' ? <Pills amount={10} text="Running" color="green" /> : <Pills text="Ready" color="green" />}
                            </div>

                            <div className="flex-1 text-center">
                                <FontAwesomeIcon icon={faEllipsisV} className="cursor-pointer text-halfBlack text-22"/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Pipelines;