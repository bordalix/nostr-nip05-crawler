// map with list of user following
const following = new Map()

// show user (username and npub)
const renderUser = (name, pubkey) => {
  const bgStyle = 'background-color: rgba(236, 210, 166, 0.7)'
  return `
  <div
    class="space-between user-line"
    style="margin-bottom: .4rem; ${following.has(pubkey) ? bgStyle : ''}">
    <p style="
      width:200px;
      margin: 0;
      overflow: hidden;
      text-overflow:
      ellipsis;
      white-space: nowrap;">
      ${name} &middot; ${hexa2npub(pubkey)}
    </p>
    <p style="font-size:0.7rem; margin: 0; padding-top: .3rem">
      [<a href="https://astral.ninja/${hexa2npub(pubkey)}">astral</a>]
      [<a href="https://iris.to/${pubkey}">iris</a>]
      [<a href="https://snort.social/p/${pubkey}">snort</a>]
    </p>
  </div>
  `
}

// reset state
const resetState = () => {
  $('#bad-request').css('display', 'none')
  $('#no-users-found').css('display', 'none')
  $('#fetching-users').css('display', 'none')
  $('#fetching-status').text('')
  $('#fetching-progress').val(0)
  $('#results-header').css('display', 'none')
  $('#list-header').css('display', 'none')
  $('.user-line').remove()
}

const fetchListOfFollowing = async (pubkey) => {
  $('#fetching-users').css('display', '')
  $('#fetching-status').text('Fetching following list')
  const fetchInterval = setInterval(() => {
    // update fetching progress bar
    const currValue = parseInt($('#fetching-progress').val())
    $('#fetching-progress').val(currValue + 1)
  }, 1_000)
  // get all events from relays
  const filter = { authors: [pubkey], kinds: [3] }
  const data = await getEvents(filter)
  data.map((line) =>
    line.tags.map(([p, pubkey]) => following.set(pubkey, true))
  )
  console.log(following)
  // inform user fetching is done
  $('#fetching-status').text('Done fetching')
  clearInterval(fetchInterval)
  $('#fetching-progress').val(20)
  console.log('data', data)
}

const fetchUsersFromProvider = async () => {
  // get provider value
  const provider = $('#provider').val()
  // normalize url
  const url =
    (provider.match(/^https:\/\//) ? '' : 'https://') +
    provider +
    (provider.match(/\/$/) ? '' : '/') +
    '.well-known/nostr.json'
  // get json file
  let response
  try {
    response = await fetch(url)
  } catch (err) {
    $('#bad-request').css('display', '')
    throw new Error(err)
  }
  // show error if bad request
  if (!response.ok) {
    $('#bad-request').css('display', '')
    throw new Error('fetch response not ok')
  }
  // parse data received
  const body = JSON.parse(await response.text())
  // if no names received, show error
  if (!body.names) {
    $('#no-users-found').css('display', '')
    throw new Error('no users found')
  }
  return body.names
}

// fetch users from nip05 provider
// if a pubkey is provided, get list of following from relays
const fetchUsers = async () => {
  // reset UI
  resetState()

  //
  const pubkey = parsePubkey($('#pubkey').val())
  if (pubkey) await fetchListOfFollowing(pubkey)

  const users = await fetchUsersFromProvider()

  // show list of users
  $('#num-results').text(`${Object.keys(users).length} users found`)
  $('#results-header').css('display', '')
  for (const [name, pubkey] of Object.entries(users)) {
    $('#results').append(renderUser(name, pubkey))
  }
  $('#list-header').css('display', '')
}

const getFromExtension = async () => {
  const pubkey = await window.nostr.getPublicKey()
  if (pubkey) $('#pubkey').val(pubkey).change()
}

const pubkeyOnChange = () => {
  const display = $('#pubkey').val() ? 'none' : ''
  $('#get-from-extension').css('display', display)
}

if (window.nostr) {
  $('#get-from-extension').css('visibility', 'visible')
}
