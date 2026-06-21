let _youtubeEnabled = false;

export const getYoutubeRoomEnabled = () => _youtubeEnabled;
export const setYoutubeRoomEnabled = (enabled: boolean) => {
    _youtubeEnabled = enabled;
};
