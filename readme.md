# Zoom Recording Manager

# Getting Started

## Installation

To use Zoom Recording Manager, run:

    npm install

## Usage

 Drop your Cloud Recordings CSV in the **meetingDetails** directory as `zoomus_recordings.csv` which can be downloaded from https://zoom.us/recording
 
 Drop the recordings  in the **recordings** directory.
 
 Execute script on the command line: 
	`node main.js`

The recordings will be renamed to their respective titles in the **recordings** directory.
# Limitations

Currently the recordings have to be downloaded manually, but automated recordings download will be avaialble in the future. 

Files containing `""` cannot be renamed to their respective titles due to the limitations of  [csv-parser](https://github.com/mafintosh/csv-parser/issues/70)