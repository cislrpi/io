# Store
Store should be used for application states, not device states.
Devices should keep their own states.
This way, we can maintain the one true source of states and not have to worry about syncing states with the store.