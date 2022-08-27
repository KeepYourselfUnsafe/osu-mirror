module.exports = async function(){
    const beatmaps = client.index('beatmaps');
    const beatmapsets = client.index('beatmapsets');

    await beatmaps.updateFilterableAttributes([
        'id',
        'beatmapset_id',
        'ranked',
        'ar',
        'cs',
        'drain',
        'accuracy',
        'bpm',
        'hit_length',
        'total_length',
        'mode_int'
    ])

    await beatmaps.updateSortableAttributes([
        'id',
        'mode_int',
        'difficulty_rating',
        'ranked',
        'hit_length',
        'total_length'
    ])

    await beatmapsets.updateFilterableAttributes([
        'id',
        'ranked',
        'modes',
        'nsfw',
        'storyboard',
        'video',
        'spotlight'
    ])

    await beatmapsets.updateSortableAttributes([
        'id',
        'favourite_count',
        'rating',
        'last_updated',
        'ranked',
        'submitted_date',
        'bpm'
    ])
}