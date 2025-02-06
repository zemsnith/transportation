// Function to fetch and process student data from Google Sheet
async function fetchStudentData() {
    // Google Sheet CSV export URL
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
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            // Check if we have enough columns and the row isn't empty
            if (row.length < 5 || !row[0]) continue;
            
            const [name, gender, phone, className, rollNo] = row.map(cell => cell ? cell.trim() : '');
            if (!name || !className) continue;
            
            if (!studentsByClass[className]) {
                studentsByClass[className] = [];
            }
            
            studentsByClass[className].push({
                id: studentsByClass[className].length + 1,
                name: name,
                gender: gender,
                rollNo: rollNo || '',
                phone: phone,
                class: className,
                section: ''
            });
        }
        
        return studentsByClass;
    } catch (error) {
        console.error('Error fetching student data:', error);
        // Fallback to Class 7 data if fetch fails
        return {
            '7': [
                { id: '1', name: 'Prashna Karki', gender: 'Female', rollNo: '1', phone: '9825512557', class: '7', section: '' },
                { id: '2', name: 'Nilu Magar', gender: 'Female', rollNo: '2', phone: '9811324082', class: '7', section: '' },
                { id: '3', name: 'Rahul B.K.', gender: 'Female', rollNo: '3', phone: '9810514125', class: '7', section: '' },
                { id: '4', name: 'Gaurab Limbu', gender: 'Female', rollNo: '4', phone: '9824346825', class: '7', section: '' },
                { id: '5', name: 'Mousam Rai', gender: 'Female', rollNo: '5', phone: '9804066906', class: '7', section: '' },
                { id: '6', name: 'Joresh Rai', gender: 'Male', rollNo: '6', phone: '9804314980', class: '7', section: '' },
                { id: '7', name: 'Sayan Rai', gender: 'Male', rollNo: '7', phone: '9807058819', class: '7', section: '' },
                { id: '8', name: 'Saina Rai', gender: 'Male', rollNo: '8', phone: '9811063971', class: '7', section: '' },
                { id: '9', name: 'Alina Limbu', gender: 'Male', rollNo: '9', phone: '9818236272', class: '7', section: '' },
                { id: '10', name: 'Soina Tamang', gender: 'Female', rollNo: '10', phone: '9824351542', class: '7', section: '' },
                { id: '11', name: 'Phiroj Rai', gender: 'Female', rollNo: '11', phone: '9819308470', class: '7', section: '' },
                { id: '12', name: 'Bishnu Adhikari', gender: 'Female', rollNo: '12', phone: '9804088826', class: '7', section: '' },
                { id: '13', name: 'Rohit Rai', gender: 'Male', rollNo: '13', phone: '9811344864', class: '7', section: '' },
                { id: '14', name: 'Sishir Magar', gender: 'Male', rollNo: '14', phone: '9817344389', class: '7', section: '' },
                { id: '15', name: 'Ansh Lhayo Magar', gender: 'Female', rollNo: '15', phone: '9817343204', class: '7', section: '' },
                { id: '16', name: 'Jashna Limbu', gender: 'Female', rollNo: '16', phone: '9819365953', class: '7', section: '' },
                { id: '17', name: 'Ninamma Rai', gender: 'Female', rollNo: '17', phone: '9819004269', class: '7', section: '' },
                { id: '18', name: 'Lidiya Rai', gender: 'Female', rollNo: '18', phone: '9769806982', class: '7', section: '' }
            ]
        };
    }
}

// Initialize the page with data from Google Sheet
document.addEventListener('DOMContentLoaded', async () => {
    const studentsByClass = await fetchStudentData();
    
    // Update class dropdown
    const classSelect = document.getElementById('classSelect');
    const classes = Object.keys(studentsByClass).sort((a, b) => Number(a) - Number(b));
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = `Class ${className}`;
        classSelect.appendChild(option);
    });
    
    // Store student data
    window.studentsByClass = studentsByClass;
    
    // Update class select options
    function updateClassOptions() {
        classSelect.innerHTML = '<option value="">Select Class</option>';
        Object.keys(studentsByClass).sort((a, b) => Number(a) - Number(b)).forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = `Class ${className}`;
            classSelect.appendChild(option);
        });
    }
    
    // Display students for selected class
    function displayStudents() {
        const selectedClass = classSelect.value;
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = '';
        
        if (!selectedClass) return;
        
        const students = studentsByClass[selectedClass] || [];
        
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
    
    // Select a student and show bus assignment form
    function selectStudent(student) {
        // Remove previous selection
        const previousSelected = studentList.querySelector('.selected');
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
        
        // Add event listeners for saving assignments
        pickupStop.onchange = dropoffStop.onchange = () => saveStudentAssignment(student.id);
    }
    
    // Event Listeners
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
    
    const pickupStop = document.getElementById('pickupStop');
    pickupStop.addEventListener('change', () => {
        if (document.getElementById('sameLocation').checked) {
            copyPickupToDropoff();
        }
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
        updateStops(dropoffBus.value, dropoffStop, pickupStop.value);
    }
    
    // Update stops based on selected bus
    function updateStops(busId, stopSelect, selectedValue = '') {
        stopSelect.innerHTML = '<option value="">Select Location</option>';
        
        if (!busId) return;
        
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
            
            window.studentBusAssignments[studentId] = {
                pickupBus: pickupBus.value,
                pickupStop: pickupStop.value,
                dropoffBus: sameLocation.checked ? pickupBus.value : dropoffBus.value,
                dropoffStop: sameLocation.checked ? pickupStop.value : dropoffStop.value
            };
            displayStudents(); // Refresh the display
        }
    }
    
    // Initialize the app
    function initializeApp() {
        updateClassOptions();
        classSelect.addEventListener('change', displayStudents);
    }
    
    initializeApp();
});

// Store student bus assignments
window.studentBusAssignments = {};

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
