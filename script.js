// Store student bus assignments
let studentBusAssignments = {};

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

// Function to fetch student data from Google Sheet
async function fetchStudentData() {
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1m0XoXRhxfLxIQ61dmHtO8R2iyiCUWqli3WpxXW1CI94/export?format=csv&gid=57740857';
    
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));
        
        // Skip header row and process data
        const studentsByClass = {};
        
        // Process each row starting from row 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 7) continue; // Make sure we have enough columns
            
            // Get values from specific columns
            const name = row[1]?.trim(); // Team column
            const phone = row[6]?.trim(); // SMS Mobile Number column
            const gender = row[2]?.trim(); // Ethnicity column (we'll use this for gender)
            
            // Skip if we don't have essential data
            if (!name) continue;
            
            // For now, let's put all students in Class 7 (we'll update this later)
            const className = '7';
            
            if (!studentsByClass[className]) {
                studentsByClass[className] = [];
            }
            
            studentsByClass[className].push({
                id: studentsByClass[className].length + 1,
                name: name,
                gender: gender,
                phone: phone
            });
        }
        
        return studentsByClass;
    } catch (error) {
        console.error('Error fetching student data:', error);
        return {}; // Return empty object if fetch fails
    }
}

// Initialize the page with student data
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    const classSelect = document.getElementById('classSelect');
    const studentList = document.getElementById('studentList');
    
    // Add class options
    classSelect.innerHTML = '<option value="">Select Class</option>';
    const classes = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = `Class ${className}`;
        classSelect.appendChild(option);
    });
    
    try {
        // Fetch and store student data
        const studentData = await fetchStudentData();
        window.studentsByClass = studentData;
        window.studentBusAssignments = {};
        
        // Display students when class is selected
        classSelect.addEventListener('change', () => {
            const selectedClass = classSelect.value;
            studentList.innerHTML = '';
            
            if (!selectedClass) return;
            
            const students = studentData[selectedClass] || [];
            if (students.length === 0) {
                studentList.innerHTML = '<div class="error">No students found in this class</div>';
                return;
            }
            
            students.forEach(student => {
                const studentCard = document.createElement('div');
                studentCard.className = 'student-card';
                
                const assignment = window.studentBusAssignments[student.id];
                let busInfo = 'No bus assignment';
                
                if (assignment) {
                    busInfo = `Pick: ${assignment.pickupBus} (${assignment.pickupStop}) | Drop: ${assignment.dropoffBus} (${assignment.dropoffStop})`;
                }
                
                studentCard.innerHTML = `
                    <div class="student-info">
                        <div class="student-name"><strong>${student.name}</strong> ${student.gender === 'Female' ? '👧' : '👦'}</div>
                        <div class="student-details">
                            <span>Phone: ${student.phone || 'N/A'}</span>
                        </div>
                        <div class="bus-info">${busInfo}</div>
                    </div>
                `;
                
                studentCard.addEventListener('click', () => selectStudent(student));
                studentList.appendChild(studentCard);
            });
        });
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Select a student and show bus assignment form
function selectStudent(student) {
    // Remove previous selection
    const previousSelected = document.querySelector('.student-card.selected');
    if (previousSelected) previousSelected.classList.remove('selected');
    
    // Add selection to clicked student
    const studentCard = event.target.closest('.student-card');
    studentCard.classList.add('selected');
    
    // Show bus selection form and hide initial message
    const busSelectionForm = document.getElementById('busSelectionForm');
    busSelectionForm.classList.remove('hidden');
    const initialMessage = document.getElementById('initialMessage');
    initialMessage.classList.add('hidden');
    
    // Update selected student name
    const selectedStudentName = document.getElementById('selectedStudentName');
    selectedStudentName.textContent = student.name;
    
    // Reset same location checkbox
    const sameLocation = document.getElementById('sameLocation');
    sameLocation.checked = false;
    const dropoffBus = document.getElementById('dropoffBus');
    dropoffBus.closest('.bus-section').classList.remove('disabled');
    
    // Load existing assignments
    const assignment = window.studentBusAssignments[student.id];
    if (assignment) {
        const pickupBus = document.getElementById('pickupBus');
        pickupBus.value = assignment.pickupBus;
        dropoffBus.value = assignment.dropoffBus;
        const pickupStop = document.getElementById('pickupStop');
        const dropoffStop = document.getElementById('dropoffStop');
        updateStops(assignment.pickupBus, pickupStop, assignment.pickupStop);
        updateStops(assignment.dropoffBus, dropoffStop, assignment.dropoffStop);
        
        // Check if pickup and dropoff are the same
        if (assignment.pickupBus === assignment.dropoffBus && 
            assignment.pickupStop === assignment.dropoffStop) {
            sameLocation.checked = true;
            dropoffBus.closest('.bus-section').classList.add('disabled');
        }
    } else {
        const pickupBus = document.getElementById('pickupBus');
        pickupBus.value = '';
        dropoffBus.value = '';
        const pickupStop = document.getElementById('pickupStop');
        const dropoffStop = document.getElementById('dropoffStop');
        pickupStop.innerHTML = '<option value="">Select Location</option>';
        dropoffStop.innerHTML = '<option value="">Select Location</option>';
    }
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

// Handle bus selection changes
const pickupBus = document.getElementById('pickupBus');
pickupBus.addEventListener('change', () => {
    const pickupStop = document.getElementById('pickupStop');
    updateStops(pickupBus.value, pickupStop);
    if (document.getElementById('sameLocation').checked) {
        copyPickupToDropoff();
    }
});

const dropoffBus = document.getElementById('dropoffBus');
dropoffBus.addEventListener('change', () => {
    const dropoffStop = document.getElementById('dropoffStop');
    updateStops(dropoffBus.value, dropoffStop);
});

// Handle same location checkbox
const sameLocation = document.getElementById('sameLocation');
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
    const dropoffStop = document.getElementById('dropoffStop');
    updateStops(dropoffBus.value, dropoffStop, document.getElementById('pickupStop').value);
}

// Save student bus assignment
function saveStudentAssignment(studentId) {
    const pickupBus = document.getElementById('pickupBus');
    const pickupStop = document.getElementById('pickupStop');
    const dropoffBus = document.getElementById('dropoffBus');
    const dropoffStop = document.getElementById('dropoffStop');
    const sameLocation = document.getElementById('sameLocation');
    
    if (pickupBus.value && pickupStop.value && 
        (sameLocation.checked || (dropoffBus.value && dropoffStop.value))) {
        
        window.studentBusAssignments[studentId] = {
            pickupBus: pickupBus.value,
            pickupStop: pickupStop.value,
            dropoffBus: sameLocation.checked ? pickupBus.value : dropoffBus.value,
            dropoffStop: sameLocation.checked ? pickupStop.value : dropoffStop.value
        };
        
        // Refresh the display
        const classSelect = document.getElementById('classSelect');
        const selectedClass = classSelect.value;
        if (selectedClass) {
            const students = window.studentsByClass[selectedClass] || [];
            displayStudents(students);
        }
    }
}

// Display students
function displayStudents(students) {
    const studentList = document.getElementById('studentList');
    studentList.innerHTML = '';
    
    if (students.length === 0) {
        studentList.innerHTML = '<div class="error">No students found in this class</div>';
        return;
    }
    
    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        
        const assignment = window.studentBusAssignments[student.id];
        let busInfo = 'No bus assignment';
        
        if (assignment) {
            busInfo = `Pick: ${assignment.pickupBus} (${assignment.pickupStop}) | Drop: ${assignment.dropoffBus} (${assignment.dropoffStop})`;
        }
        
        studentCard.innerHTML = `
            <div class="student-info">
                <div class="student-name"><strong>${student.name}</strong> ${student.gender === 'Female' ? '👧' : '👦'}</div>
                <div class="student-details">
                    <span>Phone: ${student.phone || 'N/A'}</span>
                </div>
                <div class="bus-info">${busInfo}</div>
            </div>
        `;
        
        studentCard.addEventListener('click', () => selectStudent(student));
        studentList.appendChild(studentCard);
    });
}

// Add styles
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
