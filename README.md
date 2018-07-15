# SlackBackup

*SlackBackup* is an [Electron](https://electronjs.org/) app to simplify archiving Slack messages.  It is built on top of [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).

While [Slack](https://slack.com/) is a reasonable messaging system, the "ransom" business model, of keeping the users' own data hidden from the people who generated it, bothers me.  I also like to tinker with piles of data, and needed an easy way of turning Slack messages into Markdown for my notes, since I use [BoostNote](https://boostnote.io/).

## Install and Run

Assuming the packaging worked...

1. Head over to the [Releases](https://github.com/jcolag/SlackBackup/releases) page on GitHub.
1. Download the version of _SlackBackup_ for your computer.
1. Install _SlackBackup_ (exception:  If you're on Linux, you won't need to install an [AppImage](https://appimage.org/) package).
1. Run!

Please note that there is a nuisance bug where the checkboxes (displayed by [Bootswatch](https://bootswatch.com/), for those who care) are oddly offset to cover the label text.  This only affects the installable versions, not development, making this somewhat difficult to figure out.

For the people who want to see debugging information or make changes to the system, there's a bit of a process.  You'll need to:

 1. Download or clone the repository (see the **Clone or download** button on [the GitHub page](https://github.com/jcolag/SlackBackup)).
 1. Install a recent version of [Node.js](https://nodejs.org/en/) for your machine.
 1. At a command prompt/shell (run `cmd` on Windows, for example)...

 > 1. Go to the folder/directory where you put the repository.
 > 1. Type `npm install` to get the requirement.  Note that this currently sometimes reports errors that appear to be ignorable, with no effect on the running program.  One day, they'll get fixed...
 > 1. Type `npm run start` and the window will pop up.

And you should be ready to go!

Note:  If you're packaging _SlackBackup_ for Windows, but are on Linux (`npm run package-all`), you'll need a current version of your distribution and Wine 1.8 or higher.  Previous versions of this file indicated a problem with packaging, which was using an older Linux distribution that didn't support current libraries.

## Usage

As a quick overview to *SlackBackup*, there are six major screens:  [Configuration](#configuration), [Download Selection](#download-selection), [File Deletion](#file-deletion), [Conversation View](#conversations), [Search Results](#search-results), and [Data Visualizations](#visualizations).

(Screenshots forthcoming...)

### Configuration

The configuration screen should be fairly straightforward.  You will decide on or add...

* A token to access each Slack team; clicking **Add** will walk you through the process.
* A folder where you'll save archived Slack messages.  Inside your documents folder will be recommended by default.
* A number of days you want to ignore files and images you have sent to other users.  *SlackBackup* will not act on this until you say so, and you will have the opportunity to change the decision on a file-by-file basis.
* Whether you want to save conversations with no content.  You can ignore this, but may have a small effect on some visualizations, especially in the future.
* Whether you want to save Slack channels that you are not subscribed to.  This will affect what you can search.

When done with any changes, click **Save Configuration** to remember this setup.  Note that, if you're uncomfortable with leaving your Slack tokens on your computer, you shouldn't save them as part of the configuration.

Click **List Conversations** to decide what to [download](#download-selection).

### Download Selection

Conversations include the team's channels, plus direct messages and group chats you're involved with.  On this screen, you can decide which you want archived and which you don't care about, if you want to override the default suggestions (channels will be chosen based on your subscriptions, if you chose that configuration option, and direct messages to deleted users will be skipped).

Click **Download** and *SlackBackup* will update what it has previously archived with what you currently have available.  If there are any messages downloaded that you have not read, the status bar will notify you.

Click **View Files** to [delete old files](#file-deletion).

### File Deletion

Every image or file you send to another user is saved by Slack, and counts against the team's quota.  Sometimes, that adds up to something significant and team members will start seeing messages about usage problems or will not be able to upload more files.  This screen lists your files.

You can view them on Slack's website or, hovering over the name, show the size and age of each file.

Select the files you no longer need.  If they are older than the time you set on the [Configuration screen](#configuration), they will already be selected, but you can de-select them if you still need them.

Click **Delete Selected Files** and Slack will be notified to mark them as deleted.  Slack does not always act on this immediately, though, so expect to possibly see them available for up to another day.

### Conversations

The primary goal of *SlackBackup* is to allow easy export of conversations to notes.  The *Conversations* screen (accessible from the menu up at the top) is an easy approach to this.  It lists every archived conversation (channel, group chat, direct message) in every team.

Click on one of the conversations to select it.  The contents will show on the right-hand side.  Click on individual messages within the conversation to select them, then click **Export Selected Messages**.  This will convert Slack's formatting to [Markdown](https://daringfireball.net/projects/markdown/) formatting in a pop-up, where you can click **Copy** to paste the Markdown version into another program.

### Search Results

The search box in the top menu uses [Fuse](http://fusejs.io/) to perform "fuzzy" searches that are resistant to typos.

The search results work almost identically to the [Conversations](#conversations).  It shows each result with information on when and where the message was sent and how good a match it was.  Selecting a message shows the relevant conversation to the right, where individual messages can be selected and converted to Markdown.

### Visualizations

The **Analysis** item on the main menu currently allows for three visualizations of the downloaded data.

* *Sentiment* shows a "relative happiness ranking" for each of your messages archived.  It uses the [AFINN](http://www2.imm.dtu.dk/pubdb/views/publication_details.php?id=6010) list via [a third-party library](https://github.com/thisandagain/sentiment) to guess at the intent behind the message.  Note that it doesn't understand sarcasm, so...
* *Readability* shows the [Flesch reading ease](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests) for each message.  Note that the readability test was designed primarily for extended texts, so some odd data points will appear, especially one-word posts where the word happens to be large.  That is, merely saying "incredible" will show as being very difficult to read.
* *Relationships* isn't perfect, but attempts to give a sense of who you deal with the most.  The dots are sized to how much that person posts where you read and should be approximately at a distance representing how often you send messages to where they read.
* *Vocabulary* likewise isn't perfect, but strips out [stop words](https://en.wikipedia.org/wiki/Stop_words) and finds the [stem](https://en.wikipedia.org/wiki/Stemming) of each word you use to give a sense of what words you use most, subject to what will fit reasonably on the screen.
* *Timing* simply shows the posts (with relative sizes) based on the day it was posted (left to right) and the time of day it was posted (bottom to top), making it possible to see trends and exceptions over time.

## Contribution

Please do!  This needs help.  There is still boilerplate code that hasn't been removed, most people probably don't care about exporting to Markdown, and the visualizations could probably use a lot of work, not to mention expansion.
