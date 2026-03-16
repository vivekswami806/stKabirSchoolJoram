
import { TIMER_FOR_BANNER } from "@/config";
import { useEffect, useState } from "react";
import { Image } from "react-native";


const bannerImages = [
    require('../assets/bannerImage/banner1.jpeg'),
    require('../assets/bannerImage/banner2.jpeg'),
    require('../assets/bannerImage/banner3.jpeg'),
    require('../assets/bannerImage/banner4.jpeg'),
    require('../assets/bannerImage/banner5.jpeg'),
    require('../assets/bannerImage/banner6.jpeg'),
    require('../assets/bannerImage/banner7.jpeg'),
    // require('../assets/bannerImage/banner8.jpg'),
    // require('../assets/bannerImage/banner9.jpg'),
    // require('../assets/bannerImage/banner10.jpg'),
  ];
 export const BannerImage = () =>{
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
          setCurrentBannerIndex(prevIndex => (prevIndex + 1) % bannerImages.length);
        }, TIMER_FOR_BANNER);
      
        return () => clearInterval(interval); // cleanup on unmount
      }, []);
    return(
        <Image source={bannerImages[currentBannerIndex]} style={{width:120, height: 140, borderRadius:10}} />
    )
  }