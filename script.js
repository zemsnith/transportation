// Fetch and process students data
async function fetchStudentsFromSheet() {
    try {
        // Show loading state
        studentList.innerHTML = '<div class="loading">Loading students...</div>';

        const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHLXImk6ycfpX_lnkTZ8Buvji9yNr-fwAtPU-ULdqmMePoDmrG9CpjnSliV9ZlKg6Ehk-o-KJedRva/pub?output=csv';
        // Use a CORS proxy
        const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
        
        const response = await fetch(PROXY_URL + SHEET_URL, {
            headers: {
                'Origin': window.location.origin
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const csvText = await response.text();
        console.log('CSV Data:', csvText); // Debug log
        
        // Parse CSV data
        const rows = csvText.split('\n')
            .map(row => row.split(',')
            .map(cell => cell.trim().replace(/^"|"$/g, ''))); // Remove quotes and trim whitespace
        
        console.log('Parsed Rows:', rows); // Debug log
        
        const headers = rows[0];
        const studentData = rows.slice(1).filter(row => row.length > 1); // Skip empty rows
        
        // Convert to our format
        const studentsByClass = {};
        
        studentData.forEach((row, index) => {
            // Debug log
            console.log('Processing row:', row);
            
            const student = {
                id: row[0], // SN
                name: row[1], // Name
                gender: row[2], // Boy/Girl
                rollNo: row[3], // Unique Roll NUM
                class: row[4], // Class
                section: row[5], // Section
                phone: row[6], // Phone (R)
                address: row[7], // Temporary Address
                dobBS: row[8], // DOB BS
                dobAD: row[9] // DOB AD
            };
            
            // Only add if we have a valid class
            if (student.class && student.class.toString().trim()) {
                const className = student.class.toString().trim();
                
                if (!studentsByClass[className]) {
                    studentsByClass[className] = [];
                }
                
                studentsByClass[className].push(student);
            }
        });

        // Sort students by name within each class
        Object.keys(studentsByClass).forEach(className => {
            studentsByClass[className].sort((a, b) => a.name.localeCompare(b.name));
        });

        console.log('Processed Data:', studentsByClass); // Debug log

        // Update class select options
        updateClassOptions(Object.keys(studentsByClass));
        
        // Store the data globally
        window.studentsByClass = studentsByClass;
        
        return studentsByClass;
    } catch (error) {
        console.error('Error fetching student data:', error);
        studentList.innerHTML = `
            <div class="error">
                Error loading student data. Please try one of these solutions:
                <ol>
                    <li>Click <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank">this link</a> and click "Request temporary access to the demo server"</li>
                    <li>Then refresh this page</li>
                </ol>
            </div>`;
        return {};
    }
}

// Update class select options based on available classes
function updateClassOptions(classes) {
    classSelect.innerHTML = '<option value="">Select Class</option>';
    classes.sort((a, b) => Number(a) - Number(b)).forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = `Class ${className}`;
        classSelect.appendChild(option);
    });
}

// Update the display students function to show more details
function displayStudents() {
    const selectedClass = classSelect.value;
    studentList.innerHTML = '';
    
    if (!selectedClass) return;
    
    console.log('Selected Class:', selectedClass); // Debug log
    console.log('Available Data:', window.studentsByClass); // Debug log
    
    const students = window.studentsByClass[selectedClass] || [];
    console.log('Students to display:', students); // Debug log
    
    if (students.length === 0) {
        studentList.innerHTML = '<div class="error">No students found in this class</div>';
        return;
    }
    
    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        
        const assignment = studentBusAssignments[student.id];
        let busInfo = 'No bus assignment';
        
        if (assignment) {
            busInfo = `Pick: ${assignment.pickupBus} (${assignment.pickupStop}) | Drop: ${assignment.dropoffBus} (${assignment.dropoffStop})`;
        }
        
        studentCard.innerHTML = `
            <div class="student-info">
                <div class="student-name"><strong>${student.name}</strong> ${student.gender === 'Female' ? '👧' : '👦'}</div>
                <div class="student-details">
                    <span>Roll No: ${student.rollNo || 'N/A'}</span>
                    <span>• Phone: ${student.phone || 'N/A'}</span>
                </div>
                <div class="bus-info">${busInfo}</div>
            </div>
        `;
        
        studentCard.addEventListener('click', () => selectStudent(student));
        studentList.appendChild(studentCard);
    });
}

// Bus stop locations for each bus
const busStops = {
    'bus1': [
        'Koteshwor',
        'Tinkune',
        'New Baneshwor',
        'Mid Baneshwor',
        'Old Baneshwor'
    ],
    'bus2': [
        'Kalanki',
        'Kalimati',
        'Tripureshwor',
        'Maitighar',
        'Thapathali'
    ]
};

// Store student bus assignments
const studentBusAssignments = {};

// Get DOM elements
const classSelect = document.getElementById('classSelect');
const studentList = document.getElementById('studentList');
const busSelectionForm = document.getElementById('busSelectionForm');
const initialMessage = document.getElementById('initialMessage');
const selectedStudentName = document.getElementById('selectedStudentName');
const pickupBus = document.getElementById('pickupBus');
const dropoffBus = document.getElementById('dropoffBus');
const pickupStop = document.getElementById('pickupStop');
const dropoffStop = document.getElementById('dropoffStop');
const sameLocation = document.getElementById('sameLocation');

// Event Listeners
pickupBus.addEventListener('change', () => {
    updateStops(pickupBus.value, pickupStop);
    if (sameLocation.checked) {
        copyPickupToDropoff();
    }
});
dropoffBus.addEventListener('change', () => updateStops(dropoffBus.value, dropoffStop));
pickupStop.addEventListener('change', () => {
    if (sameLocation.checked) {
        copyPickupToDropoff();
    }
});

// Handle same location checkbox
sameLocation.addEventListener('change', function() {
    const dropoffSection = dropoffBus.closest('.bus-section');
    
    if (this.checked) {
        dropoffSection.classList.add('disabled');
        copyPickupToDropoff();
    } else {
        dropoffSection.classList.remove('disabled');
    }
});

// Copy pickup details to dropoff
function copyPickupToDropoff() {
    dropoffBus.value = pickupBus.value;
    updateStops(dropoffBus.value, dropoffStop, pickupStop.value);
}

// Select a student and show bus assignment form
function selectStudent(student) {
    // Remove previous selection
    const previousSelected = studentList.querySelector('.selected');
    if (previousSelected) previousSelected.classList.remove('selected');
    
    // Add selection to clicked student
    const studentCard = event.target.closest('.student-card');
    studentCard.classList.add('selected');
    
    // Show bus selection form and hide initial message
    busSelectionForm.classList.remove('hidden');
    initialMessage.classList.add('hidden');
    
    // Update selected student name
    selectedStudentName.textContent = student.name;
    
    // Reset same location checkbox
    sameLocation.checked = false;
    dropoffBus.closest('.bus-section').classList.remove('disabled');
    
    // Load existing assignments
    const assignment = studentBusAssignments[student.id];
    if (assignment) {
        pickupBus.value = assignment.pickupBus;
        dropoffBus.value = assignment.dropoffBus;
        updateStops(assignment.pickupBus, pickupStop, assignment.pickupStop);
        updateStops(assignment.dropoffBus, dropoffStop, assignment.dropoffStop);
        
        // Check if pickup and dropoff are the same
        if (assignment.pickupBus === assignment.dropoffBus && 
            assignment.pickupStop === assignment.dropoffStop) {
            sameLocation.checked = true;
            dropoffBus.closest('.bus-section').classList.add('disabled');
        }
    } else {
        pickupBus.value = '';
        dropoffBus.value = '';
        pickupStop.innerHTML = '<option value="">Select Location</option>';
        dropoffStop.innerHTML = '<option value="">Select Location</option>';
    }
    
    // Add event listeners for saving assignments
    pickupStop.onchange = dropoffStop.onchange = () => saveStudentAssignment(student.id);
}

// Update stops based on selected bus
function updateStops(busId, stopSelect, selectedValue = '') {
    stopSelect.innerHTML = '<option value="">Select Location</option>';
    
    if (!busId) return;
    
    busStops[busId].forEach(stop => {
        const option = document.createElement('option');
        option.value = stop;
        option.textContent = stop;
        option.selected = stop === selectedValue;
        stopSelect.appendChild(option);
    });
}

// Save student bus assignment
function saveStudentAssignment(studentId) {
    if (pickupBus.value && pickupStop.value && 
        (sameLocation.checked || (dropoffBus.value && dropoffStop.value))) {
        
        studentBusAssignments[studentId] = {
            pickupBus: pickupBus.value,
            pickupStop: pickupStop.value,
            dropoffBus: sameLocation.checked ? pickupBus.value : dropoffBus.value,
            dropoffStop: sameLocation.checked ? pickupStop.value : dropoffStop.value
        };
        displayStudents(); // Refresh the display
    }
}

// Initialize the app
async function initializeApp() {
    try {
        const data = await fetchStudentsFromSheet();
        if (Object.keys(data).length > 0) {
            window.studentsByClass = data;
            // Add event listener for class selection
            classSelect.addEventListener('change', displayStudents);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);

// Add some styles for the new student card layout
const newStyles = `
.student-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.student-name {
    font-size: 1.1rem;
    color: #2c3e50;
}

.student-details {
    font-size: 0.9em;
    color: #666;
}

.student-details span {
    margin-right: 0.5rem;
}

.bus-info {
    font-size: 0.9em;
    color: #666;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid #eee;
}

.loading, .error {
    padding: 1rem;
    text-align: center;
    color: #666;
}

.error {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 5px;
}
`;

// Create and append style element
const styleSheet = document.createElement("style");
styleSheet.textContent = newStyles;
document.head.appendChild(styleSheet);
