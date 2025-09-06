import { useEffect, useRef, useState } from "react";
import {Play,Pause} from 'lucide-react'


function Editorial({secureUrl,thumbnailUrl,duration}) {
    const videoRef = useRef(null)

    const [Playing,setPlaying] = useState(false)
    const [currentTime,setCurrentTime] = useState(0)
    const [hovering,setHovering] = useState(false)

    const formatTime = (seconds)=>{
        const mins = Math.floor(seconds/60)
        const secs = Math.floor(seconds%60)
        return `${mins}:${secs< 10 ? '0': ''}${secs}`
    }

    const PlayPause = ()=>{
        if(videoRef.current){
            if(Playing){
                videoRef.current.pause()
            }else{
                videoRef.current.play()
            }
            setPlaying(!Playing)
        }
    }

    useEffect(()=>{
        const video = videoRef.current

        const handleTimeUpdate = ()=>{
            if(video) setCurrentTime(video.currentTime)
        }
        
        if(video){
            video.addEventListener('timeupdate',handleTimeUpdate)
            return ()=> video.removeEventListener('timeupdate',handleTimeUpdate)
        }
    },[])

    return(
        <div
        className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg"
        onMouseEnter={()=>setHovering(true)}
        onMouseLeave={()=>setHovering(false)}
        >
            <video
            ref={videoRef}
            src={secureUrl}
            poster={thumbnailUrl}
            onClick={PlayPause}
            className="w-full ascept-video bg-black cursor-pointer"
            />

            <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity ${
            hovering || !Playing ? 'opacity-100' : 'opacity-0'
            }`}
            >
                <button
                onClick={PlayPause}
                className="btn btn-circle btn-primary mr-3"
                aria-label={Playing ? "Pause" : "Play"}
                >
                    {Playing  ? (
                        <Pause/>
                    ):(
                        <Play/>
                    )}
                </button>

                <div className="flex items-center w-full mt-2">
                    <span className="text-white text-sm mr-2">
                        {formatTime(currentTime)}
                    </span>
                    <input
                    type="range"
                    min='0'
                    max={duration}
                    value={currentTime}
                    onChange={(e)=>{
                        if(videoRef.current){
                            videoRef.current.currentTime = Number(e.target.value)
                        }
                    }}
                    className="range range-primary range-xs flex-1"
                    />
                    <span className="text-white text-sm ml-2`">
                    {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    )
}



export default Editorial;